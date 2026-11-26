import { eq, or } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb } from "@/db";
import { attendances, badges, events, introRequests, projects, userPhotos, users } from "@/db/schema";

// "Download my data": everything we store about the signed-in user, as JSON.
export async function GET() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return new Response("Not signed in", { status: 401 });

  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!user) return new Response("Not found", { status: 404 });

  const [photo] = await db.select().from(userPhotos).where(eq(userPhotos.userId, id)).limit(1);
  const [mine, att, bad, intros] = await Promise.all([
    db.select().from(projects).where(eq(projects.userId, id)),
    db.select({ event: events.title, joinedAt: attendances.joinedAt, checkedInAt: attendances.checkedInAt })
      .from(attendances).innerJoin(events, eq(attendances.eventId, events.id)).where(eq(attendances.userId, id)),
    db.select().from(badges).where(eq(badges.userId, id)),
    db.select({ from: introRequests.fromUserId, to: introRequests.toUserId, message: introRequests.message, status: introRequests.status, createdAt: introRequests.createdAt })
      .from(introRequests).where(or(eq(introRequests.fromUserId, id), eq(introRequests.toUserId, id))),
  ]);

  const body = {
    exportedAt: new Date().toISOString(),
    profile: user,
    profilePicture: photo ? `data:image/jpeg;base64,${photo.data}` : null,
    projects: mine,
    eventAttendance: att,
    badges: bad,
    introRequests: intros.map((r) => ({ direction: r.from === id ? "sent" : "received", message: r.message, status: r.status, createdAt: r.createdAt })),
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: { "Content-Type": "application/json", "Content-Disposition": 'attachment; filename="my-data.json"', "Cache-Control": "no-store" },
  });
}
