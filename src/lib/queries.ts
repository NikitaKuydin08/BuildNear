import { and, asc, desc, eq, inArray, ne, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { attendances, badges, events, introRequests, users } from "@/db/schema";

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

// Everyone who joined the event (except me), people who are checked in first.
export async function listAttendees(eventId: string, meId: string) {
  return getDb()
    .select({ user: users, checkedInAt: attendances.checkedInAt })
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
  const reveal = (accepted: boolean, login: string) => (accepted ? login : null);
  return {
    incoming: rows.map((r) => ({
      id: r.req.id,
      status: r.req.status,
      message: r.req.message,
      name: r.from.name,
      stack: r.from.stack,
      githubLogin: reveal(r.req.status === "accepted", r.from.githubLogin),
    })),
    outgoing: out.map((r) => ({
      id: r.req.id,
      status: r.req.status,
      message: r.req.message,
      name: r.to.name,
      stack: r.to.stack,
      githubLogin: reveal(r.req.status === "accepted", r.to.githubLogin),
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
