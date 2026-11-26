"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { getDb } from "@/db";
import { events, introRequests } from "@/db/schema";
import { recordConnection } from "@/lib/brain";
import { canConnect, getIntro, getUser } from "@/lib/queries";
import { requireUserId } from "@/lib/session";

const MAX_MESSAGE = 200;

// Only same-site relative paths, so a forged "back" field can't redirect elsewhere.
function safeBack(v: unknown) {
  const s = String(v ?? "");
  return s.startsWith("/") && !s.startsWith("//") && !s.includes("\\") ? s : "/events";
}

// Send an intro request. Server-side rules (the UI is not trusted):
// - not to yourself, - only to someone who joined an event you joined, or who is nearby right now,
// - one request per pair; if they already asked you, this accepts theirs.
export async function sendIntro(formData: FormData) {
  const me = await requireUserId();
  const to = String(formData.get("toUserId") ?? "");
  const back = safeBack(formData.get("back"));
  const message = String(formData.get("message") ?? "").trim().slice(0, MAX_MESSAGE);

  if (!to || to === me) redirect(back);
  const { allowed, eventId } = await canConnect(me, to);
  if (!allowed) redirect(back);

  const db = getDb();
  const [reverse] = await db
    .select()
    .from(introRequests)
    .where(and(eq(introRequests.fromUserId, to), eq(introRequests.toUserId, me)))
    .limit(1);

  if (reverse) {
    if (reverse.status === "pending") {
      await db
        .update(introRequests)
        .set({ status: "accepted", respondedAt: new Date() })
        .where(eq(introRequests.id, reverse.id));
    }
  } else {
    await db.insert(introRequests).values({ fromUserId: me, toUserId: to, eventId, message }).onConflictDoNothing();
  }

  revalidatePath("/inbox");
  redirect(back);
}

// Only the recipient can accept or decline.
export async function respondIntro(formData: FormData) {
  const me = await requireUserId();
  const id = String(formData.get("id") ?? "");
  const decision = formData.get("decision") === "accept" ? "accepted" : "declined";

  const req = await getIntro(id);
  if (!req || req.toUserId !== me || req.status !== "pending") redirect("/inbox");

  await getDb().update(introRequests).set({ status: decision, respondedAt: new Date() }).where(eq(introRequests.id, id));

  // Only accepted connections are remembered by the Brain. Declines are never stored.
  if (decision === "accepted") {
    after(async () => {
      const [a, b] = await Promise.all([getUser(req.fromUserId), getUser(req.toUserId)]);
      let title: string | null = null;
      if (req.eventId) {
        const [ev] = await getDb().select().from(events).where(eq(events.id, req.eventId)).limit(1);
        title = ev?.title ?? null;
      }
      if (a && b) await recordConnection(a, b, title, req.id, req.message);
    });
  }
  revalidatePath("/inbox");
  redirect("/inbox");
}
