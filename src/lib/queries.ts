import { and, asc, desc, eq, inArray, isNotNull, lt, ne, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { attendances, badges, events, introRequests, projects, users } from "@/db/schema";
import { contactLinks } from "@/lib/contacts";
import { distanceKm, isFresh, LOCATION_TTL_MS, NEARBY_KM } from "@/lib/presence";

export async function getEventBySlug(slug: string) {
  const [row] = await getDb().select().from(events).where(eq(events.slug, slug)).limit(1);
  return row ?? null;
}

export async function getAttendance(userId: string, eventId: string) {
  const [row] = await getDb()
    .select()
    .from(attendances)
    .where(and(eq(attendances.userId, userId), eq(attendances.eventId, eventId)))
    .limit(1);
  return row ?? null;
}

export async function getUser(userId: string) {
  const [row] = await getDb().select().from(users).where(eq(users.id, userId)).limit(1);
  return row ?? null;
}

export async function listEventsFor(userId: string) {
  return getDb()
    .select({ event: events, joinedAt: attendances.joinedAt, checkedInAt: attendances.checkedInAt })
    .from(events)
    .leftJoin(attendances, and(eq(attendances.eventId, events.id), eq(attendances.userId, userId)))
    .orderBy(asc(events.startsAt));
}

// Events I really checked in to, newest first. The home screen picks the one I am still at.
export async function activeEventsFor(userId: string) {
  return getDb()
    .select({ event: events, checkedInAt: attendances.checkedInAt, leftAt: attendances.leftAt })
    .from(attendances)
    .innerJoin(events, eq(attendances.eventId, events.id))
    .where(and(eq(attendances.userId, userId), isNotNull(attendances.checkedInAt)))
    .orderBy(desc(attendances.checkedInAt));
}

// Everyone who joined the event (except me), people who are checked in first.
export async function listAttendees(eventId: string, meId: string) {
  return getDb()
    .select({ user: users, checkedInAt: attendances.checkedInAt, leftAt: attendances.leftAt })
    .from(attendances)
    .innerJoin(users, eq(attendances.userId, users.id))
    .where(and(eq(attendances.eventId, eventId), ne(attendances.userId, meId)))
    .orderBy(sql`${attendances.checkedInAt} desc nulls last`, desc(attendances.joinedAt));
}

// Do two users share at least one event? Intro requests are only allowed between people who do.
export async function shareEvent(a: string, b: string) {
  const db = getDb();
  const mine = await db.select({ e: attendances.eventId }).from(attendances).where(eq(attendances.userId, a));
  if (mine.length === 0) return null;
  const [row] = await db
    .select({ e: attendances.eventId })
    .from(attendances)
    .where(and(eq(attendances.userId, b), inArray(attendances.eventId, mine.map((m) => m.e))))
    .limit(1);
  return row?.e ?? null;
}

export type IntroState = { id: string; direction: "sent" | "received"; status: string };

// Map of otherUserId -> state of the request between me and them (either direction).
export async function introStatesFor(meId: string, otherIds: string[]) {
  const out = new Map<string, IntroState>();
  if (otherIds.length === 0) return out;
  const rows = await getDb()
    .select()
    .from(introRequests)
    .where(
      or(
        and(eq(introRequests.fromUserId, meId), inArray(introRequests.toUserId, otherIds)),
        and(eq(introRequests.toUserId, meId), inArray(introRequests.fromUserId, otherIds)),
      ),
    );
  for (const r of rows) {
    const sent = r.fromUserId === meId;
    out.set(sent ? r.toUserId : r.fromUserId, { id: r.id, direction: sent ? "sent" : "received", status: r.status });
  }
  return out;
}

export async function getIntro(id: string) {
  const [row] = await getDb().select().from(introRequests).where(eq(introRequests.id, id)).limit(1);
  return row ?? null;
}

// Everything in my inbox. githubLogin is selected only for accepted rows (the reveal).
export async function listInbox(meId: string) {
  const rows = await getDb()
    .select({ req: introRequests, from: users })
    .from(introRequests)
    .innerJoin(users, eq(introRequests.fromUserId, users.id))
    .where(eq(introRequests.toUserId, meId))
    .orderBy(desc(introRequests.createdAt));
  const out = await getDb()
    .select({ req: introRequests, to: users })
    .from(introRequests)
    .innerJoin(users, eq(introRequests.toUserId, users.id))
    .where(eq(introRequests.fromUserId, meId))
    .orderBy(desc(introRequests.createdAt));
  // The reveal: GitHub link and contacts are included only when the request was accepted.
  const reveal = (accepted: boolean, u: typeof users.$inferSelect) =>
    accepted ? { login: u.githubLogin, links: contactLinks(u) } : null;
  return {
    incoming: rows.map((r) => ({
      id: r.req.id,
      status: r.req.status,
      message: r.req.message,
      name: r.from.name,
      stack: r.from.stack,
      contact: reveal(r.req.status === "accepted", r.from),
    })),
    outgoing: out.map((r) => ({
      id: r.req.id,
      status: r.req.status,
      message: r.req.message,
      name: r.to.name,
      stack: r.to.stack,
      contact: reveal(r.req.status === "accepted", r.to),
    })),
  };
}

export async function getBadge(userId: string, eventId: string) {
  const [row] = await getDb()
    .select()
    .from(badges)
    .where(and(eq(badges.userId, userId), eq(badges.eventId, eventId)))
    .limit(1);
  return row ?? null;
}

export async function listBadges(userId: string) {
  return getDb()
    .select({ badge: badges, event: events })
    .from(badges)
    .innerJoin(events, eq(badges.eventId, events.id))
    .where(eq(badges.userId, userId))
    .orderBy(desc(badges.createdAt));
}

// Events a person really checked in to, grouped by the event's field. Drives the leveled field badges.
export async function fieldProgress(userId: string) {
  const rows = await getDb()
    .select({ field: events.field, n: sql<number>`count(distinct ${attendances.eventId})::int` })
    .from(attendances)
    .innerJoin(events, eq(attendances.eventId, events.id))
    .where(and(eq(attendances.userId, userId), isNotNull(attendances.checkedInAt), isNotNull(events.field)))
    .groupBy(events.field);
  return rows.map((r) => ({ field: r.field as string, count: Number(r.n) }));
}

// ---- Projects ----
export async function listProjects(userId: string) {
  return getDb().select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.featured), asc(projects.createdAt));
}

export type FeaturedProject = { title: string; description: string; url: string | null; visibility: string };

// The "proudest project" for a set of people, shown on their cards.
export async function featuredFor(userIds: string[]) {
  const out = new Map<string, FeaturedProject>();
  if (userIds.length === 0) return out;
  const rows = await getDb()
    .select()
    .from(projects)
    .where(and(inArray(projects.userId, userIds), eq(projects.featured, true)));
  for (const r of rows) out.set(r.userId, { title: r.title, description: r.description, url: r.url, visibility: r.visibility });
  return out;
}

// User + featured project, in the shape the Brain note needs.
export async function getBrainUser(userId: string) {
  const u = await getUser(userId);
  if (!u) return null;
  const f = (await featuredFor([userId])).get(userId) ?? null;
  return { ...u, project: f ? { title: f.title, description: f.description } : null };
}

// ---- Nearby ----
// Positions older than the time limit are erased from the database, not just ignored ("auto-expiring").
// Runs whenever someone loads a screen that uses locations, so there is no scheduler to maintain.
export async function purgeExpiredLocations() {
  const cutoff = new Date(Date.now() - LOCATION_TTL_MS);
  await getDb()
    .update(users)
    .set({ locationLat: null, locationLon: null, locationAt: null })
    .where(and(isNotNull(users.locationAt), lt(users.locationAt, cutoff)));
}

// Opted-in people with a fresh position within NEARBY_KM of me, closest first. Coordinates never leave the server.
export async function nearbyPeople(me: { id: string; locationLat: number | null; locationLon: number | null }) {
  await purgeExpiredLocations();
  if (me.locationLat === null || me.locationLon === null) return [];
  const rows = await getDb()
    .select()
    .from(users)
    .where(and(ne(users.id, me.id), eq(users.shareLocation, true)));
  return rows
    .filter((u) => u.locationLat !== null && u.locationLon !== null && isFresh(u.locationAt))
    .map((u) => ({ user: u, km: distanceKm(me.locationLat!, me.locationLon!, u.locationLat!, u.locationLon!) }))
    .filter((x) => x.km <= NEARBY_KM)
    .sort((a, b) => a.km - b.km);
}

// Intro requests are allowed between people who share an event, or who are both nearby right now.
export async function canConnect(meId: string, otherId: string) {
  const eventId = await shareEvent(meId, otherId);
  if (eventId) return { allowed: true, eventId };
  const [a, b] = await Promise.all([getUser(meId), getUser(otherId)]);
  if (!a || !b) return { allowed: false, eventId: null };
  const bothFresh =
    a.shareLocation && b.shareLocation && isFresh(a.locationAt) && isFresh(b.locationAt) &&
    a.locationLat !== null && a.locationLon !== null && b.locationLat !== null && b.locationLon !== null;
  const near = bothFresh && distanceKm(a.locationLat!, a.locationLon!, b.locationLat!, b.locationLon!) <= NEARBY_KM;
  return { allowed: !!near, eventId: null };
}

// People who checked in to any event I also checked in to (never strangers), with the event titles they share with me.
// Same visibility circle as an event page, just across all of my events.
export async function coAttendeesAcrossEvents(meId: string) {
  const db = getDb();
  const mine = await db
    .select({ e: attendances.eventId })
    .from(attendances)
    .where(and(eq(attendances.userId, meId), isNotNull(attendances.checkedInAt)));
  if (mine.length === 0) return [];
  const rows = await db
    .select({ user: users, title: events.title, at: attendances.checkedInAt })
    .from(attendances)
    .innerJoin(users, eq(attendances.userId, users.id))
    .innerJoin(events, eq(attendances.eventId, events.id))
    .where(and(inArray(attendances.eventId, mine.map((m) => m.e)), ne(attendances.userId, meId), isNotNull(attendances.checkedInAt)))
    .orderBy(desc(attendances.checkedInAt));
  const byUser = new Map<string, { user: (typeof rows)[number]["user"]; titles: string[] }>();
  for (const r of rows) {
    const cur = byUser.get(r.user.id) ?? { user: r.user, titles: [] };
    if (!cur.titles.includes(r.title)) cur.titles.push(r.title);
    byUser.set(r.user.id, cur);
  }
  return [...byUser.values()];
}
