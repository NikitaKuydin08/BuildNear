"use server";

import { and, eq, gt, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { messages } from "@/db/schema";
import { getIntro } from "@/lib/queries";
import { requireUserId } from "@/lib/session";

const MAX_BODY = 500;
const MAX_PER_MINUTE = 20;

// Only the two people of an ACCEPTED intro can write to each other. The UI is not trusted: everything is checked here.
export async function sendMessage(formData: FormData) {
  const me = await requireUserId();
  const introId = String(formData.get("introId") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(introId)) redirect("/inbox");
  const intro = await getIntro(introId);
  if (!intro || intro.status !== "accepted" || (intro.fromUserId !== me && intro.toUserId !== me)) redirect("/inbox");

  const body = String(formData.get("body") ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, MAX_BODY);
  if (!body) redirect(`/inbox/${introId}`);

  const db = getDb();
  const [recent] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(messages)
    .where(and(eq(messages.introId, introId), eq(messages.fromUserId, me), gt(messages.createdAt, new Date(Date.now() - 60_000))));
  if ((recent?.n ?? 0) >= MAX_PER_MINUTE) redirect(`/inbox/${introId}?error=slow`);

  await db.insert(messages).values({ introId, fromUserId: me, body });
  revalidatePath(`/inbox/${introId}`);
  redirect(`/inbox/${introId}`);
}
