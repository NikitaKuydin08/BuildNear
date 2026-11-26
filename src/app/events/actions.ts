"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { getDb } from "@/db";
import { attendances, badges, users } from "@/db/schema";
import { isMinterAddress, isWallet, mintBadge } from "@/lib/chain";
import { verifyToken } from "@/lib/qr-token";
import { syncProfile } from "@/lib/brain";
import { getBadge, getBrainUser, getEventBySlug } from "@/lib/queries";
import { requireUserId } from "@/lib/session";

// Entering the venue code proves presence: valid only during the event window (2 h early to the end).
export async function checkIn(formData: FormData) {
  const userId = await requireUserId();
  const slug = String(formData.get("slug") ?? "");
  const code = String(formData.get("code") ?? "").trim().toLowerCase();
  const token = String(formData.get("token") ?? "").trim();
  const event = await getEventBySlug(slug);
  if (!event) redirect("/events");

  const now = Date.now();
  const opens = event.startsAt.getTime() - 2 * 60 * 60 * 1000;
  if (now < opens || now > event.endsAt.getTime()) redirect(`/events/${slug}?error=window`);
  // A live QR token (rotating) or the venue code typed by hand both prove presence.
  const tokenOk = token !== "" && verifyToken(event.id, token);
  const codeOk = code !== "" && code === event.checkInCode.trim().toLowerCase();
  if (!tokenOk && !codeOk) redirect(`/events/${slug}?error=code`);

  const db = getDb();
  await db.insert(attendances).values({ userId, eventId: event.id }).onConflictDoNothing();
  await db
    .update(attendances)
    .set({ checkedInAt: new Date(), leftAt: null })
    .where(and(eq(attendances.userId, userId), eq(attendances.eventId, event.id)));

  // Make sure the Brain knows this person before others look for matches (deduplicated by profile hash).
  after(async () => {
    const u = await getBrainUser(userId);
    if (u) await syncProfile(u);
  });
  revalidatePath(`/events/${slug}`);
  redirect(`/events/${slug}`);
}

// "I left": stop showing as here now. Your check-in (and so your badge right) stays.
export async function leaveEvent(formData: FormData) {
  const userId = await requireUserId();
  const slug = String(formData.get("slug") ?? "");
  const event = await getEventBySlug(slug);
  if (!event) redirect("/events");
  await getDb()
    .update(attendances)
    .set({ leftAt: new Date() })
    .where(and(eq(attendances.userId, userId), eq(attendances.eventId, event.id)));
  revalidatePath(`/events/${slug}`);
  redirect(`/events/${slug}`);
}

// Mint the attendance badge. Requires a venue check-in; one badge per (user, event).
// The app's wallet pays gas. The wallet address is saved on the profile for next time.
export async function claimBadge(formData: FormData) {
  const userId = await requireUserId();
  const slug = String(formData.get("slug") ?? "");
  const wallet = String(formData.get("wallet") ?? "").trim();
  const event = await getEventBySlug(slug);
  if (!event) redirect("/events");
  const back = `/events/${slug}`;

  if (!isWallet(wallet)) redirect(`${back}?error=wallet`);
  // Guard against pasting the app's own minter address by mistake.
  if (isMinterAddress(wallet)) redirect(`${back}?error=minter`);

  const db = getDb();
  const [att] = await db
    .select()
    .from(attendances)
    .where(and(eq(attendances.userId, userId), eq(attendances.eventId, event.id)))
    .limit(1);
  if (!att?.checkedInAt) redirect(`${back}?error=notchecked`);
  if (await getBadge(userId, event.id)) redirect(back);

  await db.update(users).set({ walletAddress: wallet }).where(eq(users.id, userId));

  let txHash: string;
  try {
    txHash = await mintBadge(wallet, event.slug, event.title);
  } catch (e) {
    console.error("mint failed", e instanceof Error ? e.message : e);
    redirect(`${back}?error=mint`);
  }
  await db.insert(badges).values({ userId, eventId: event.id, wallet, txHash }).onConflictDoNothing();
  revalidatePath(back);
  redirect(back);
}
