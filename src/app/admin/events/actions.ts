"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { events } from "@/db/schema";
import { requireAdmin } from "@/lib/organizer";

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
  const back = "/admin/events?";

  if (!title || !venue || !startsAt || !endsAt || endsAt <= startsAt) redirect(`${back}error=1`);

  // Optional link: only http(s) is kept.
  const lumaUrl = /^https?:\/\//i.test(luma) ? luma.slice(0, 300) : null;
  const checkInCode = randomBytes(3).toString("hex").toUpperCase();

  await getDb().insert(events).values({ slug: slugify(title), title, venue, startsAt, endsAt, checkInCode, lumaUrl });
  revalidatePath("/events");
  redirect(`${back}created=1`);
}
