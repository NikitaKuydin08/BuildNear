"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { eq } from "drizzle-orm";
import { events } from "@/db/schema";
import { BADGE_FIELDS } from "@/lib/badge-levels";
import { requireAdmin } from "@/lib/organizer";
import { parseCoords } from "@/lib/venue";

function slugify(title: string) {
  const base = title.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "event";
  return `${base}-${randomBytes(2).toString("hex")}`;
}

// Form times are entered in Bangkok time (UTC+7), whatever timezone the server runs in.
function bangkok(value: string) {
  const d = new Date(`${value}:00+07:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function createEvent(formData: FormData) {
  await requireAdmin("/admin/events");

  const title = String(formData.get("title") ?? "").trim().slice(0, 80);
  const venue = String(formData.get("venue") ?? "").trim().slice(0, 120);
  const startsAt = bangkok(String(formData.get("startsAt") ?? ""));
  const endsAt = bangkok(String(formData.get("endsAt") ?? ""));
  const luma = String(formData.get("lumaUrl") ?? "").trim();
  const fieldRaw = String(formData.get("field") ?? "");
  const field = BADGE_FIELDS.some((f) => f.key === fieldRaw) ? fieldRaw : null;
  const coords = parseCoords(String(formData.get("coords") ?? ""));
  const back = "/admin/events?";

  if (!title || !venue || !startsAt || !endsAt || endsAt <= startsAt) redirect(`${back}error=1`);

  // Optional link: only http(s) is kept.
  const lumaUrl = /^https?:\/\//i.test(luma) ? luma.slice(0, 300) : null;
  const checkInCode = randomBytes(3).toString("hex").toUpperCase();

  await getDb().insert(events).values({ slug: slugify(title), title, venue, startsAt, endsAt, checkInCode, lumaUrl, field, venueLat: coords?.lat ?? null, venueLon: coords?.lon ?? null });
  revalidatePath("/events");
  redirect(`${back}created=1`);
}

// Change which badge field an existing event counts toward (or none). Admin only; the value is validated.
export async function setEventField(formData: FormData) {
  await requireAdmin("/admin/events");
  const id = String(formData.get("id") ?? "");
  const fieldRaw = String(formData.get("field") ?? "");
  const field = BADGE_FIELDS.some((f) => f.key === fieldRaw) ? fieldRaw : null;
  if (!/^[0-9a-f-]{36}$/i.test(id)) redirect("/admin/events?error=1");
  await getDb().update(events).set({ field }).where(eq(events.id, id));
  revalidatePath("/events");
  revalidatePath("/profile");
  redirect("/admin/events?updated=1");
}

// Set or clear the venue's map location of an existing event. Empty input clears it; invalid input is refused.
export async function setEventCoords(formData: FormData) {
  await requireAdmin("/admin/events");
  const id = String(formData.get("id") ?? "");
  const raw = String(formData.get("coords") ?? "").trim();
  const coords = parseCoords(raw);
  if (!/^[0-9a-f-]{36}$/i.test(id) || (raw && !coords)) redirect("/admin/events?error=coords");
  await getDb().update(events).set({ venueLat: coords?.lat ?? null, venueLon: coords?.lon ?? null }).where(eq(events.id, id));
  revalidatePath("/events");
  redirect("/admin/events?updated=1");
}
