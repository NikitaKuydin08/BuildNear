"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { signOut } from "@/auth";
import { getDb } from "@/db";
import { projects, userPhotos, users } from "@/db/schema";
import { syncProfile } from "@/lib/brain";
import { FIELD_KEYS } from "@/lib/fields";
import { cleanEmail, cleanLinkedin, cleanTelegram, cleanWhatsapp } from "@/lib/contacts";
import { getBrainUser } from "@/lib/queries";
import { requireUserId } from "@/lib/session";

const MEET = ["in_person", "open", "chat_first"];
const WORK = ["employed", "looking", "hiring"];

function parseList(value: FormDataEntryValue | null, max = 12): string[] {
  const items = String(value ?? "")
    .split(",")
    .map((x) => x.trim().slice(0, 30))
    .filter(Boolean);
  return [...new Set(items)].slice(0, max);
}

// Empty field = no contact. A filled but invalid field is dropped (the form shows the format it expects).
function optional(v: FormDataEntryValue | null, clean: (s: string) => string | null) {
  const t = String(v ?? "").trim();
  return t ? clean(t) : null;
}

export async function saveProfile(formData: FormData) {
  const userId = await requireUserId();
  const meet = String(formData.get("meetPreference") ?? "open");
  const work = String(formData.get("workStatus") ?? "");
  const db = getDb();

  await db
    .update(users)
    .set({
      stack: parseList(formData.get("stack")),
      topics: [...new Set([...formData.getAll("field").map(String).filter((k) => FIELD_KEYS.includes(k)), ...parseList(formData.get("topicsOther"))])].slice(0, 16),
      tags: parseList(formData.get("tags")),
      meetPreference: MEET.includes(meet) ? meet : "open",
      workStatus: WORK.includes(work) ? work : null,
      telegram: optional(formData.get("telegram"), cleanTelegram),
      whatsapp: optional(formData.get("whatsapp"), cleanWhatsapp),
      linkedin: optional(formData.get("linkedin"), cleanLinkedin),
      contactEmail: optional(formData.get("contactEmail"), cleanEmail),
    })
    .where(eq(users.id, userId));

  // One proudest project (shown on your profile and card) plus up to 3 other projects (profile only).
  const rows: (typeof projects.$inferInsert)[] = [];
  const read = (prefix: string, featured: boolean) => {
    const title = String(formData.get(`${prefix}title`) ?? "").trim().slice(0, 60);
    if (!title) return;
    const url = String(formData.get(`${prefix}url`) ?? "").trim();
    rows.push({
      userId,
      title,
      description: String(formData.get(`${prefix}desc`) ?? "").trim().slice(0, 140),
      stack: parseList(formData.get(`${prefix}stack`), 8),
      url: /^https?:\/\//i.test(url) ? url.slice(0, 200) : null,
      // A project with a public link is public; one written by hand without a link stays private.
      visibility: /^https?:\/\//i.test(url) ? "public" : "private",
      featured,
    });
  };
  read("pf", true);
  for (let i = 0; i < 3; i++) read(`o${i}`, false);
  await db.delete(projects).where(eq(projects.userId, userId));
  if (rows.length > 0) await db.insert(projects).values(rows);

  // Teach the Brain the new profile after the response is sent (never blocks the user).
  after(async () => {
    const u = await getBrainUser(userId);
    if (u) await syncProfile(u);
  });

  revalidatePath("/profile");
  redirect("/profile?saved=1");
}

// Deletes the account and everything linked to it (profile, projects, check-ins, intro requests, badge records).
// The on-chain badge is public and permanent; the privacy page says so.
// The button asks for one confirmation in the browser before this runs.
export async function deleteAccount() {
  const userId = await requireUserId();
  await getDb().delete(users).where(eq(users.id, userId));
  await signOut({ redirectTo: "/?deleted=1" });
}

// The browser already cropped and shrank the picture to a small square JPEG. Everything is checked again here.
export async function savePhoto(dataUrl: string) {
  const userId = await requireUserId();
  const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m || m[1].length > 200_000) return { ok: false as const };
  const buf = Buffer.from(m[1], "base64");
  if (buf.length < 100 || buf[0] !== 0xff || buf[1] !== 0xd8 || buf[2] !== 0xff) return { ok: false as const };
  const db = getDb();
  await db.insert(userPhotos).values({ userId, data: m[1] }).onConflictDoUpdate({ target: userPhotos.userId, set: { data: m[1] } });
  await db.update(users).set({ photoAt: new Date() }).where(eq(users.id, userId));
  revalidatePath("/profile");
  return { ok: true as const };
}

export async function removePhoto() {
  const userId = await requireUserId();
  const db = getDb();
  await db.delete(userPhotos).where(eq(userPhotos.userId, userId));
  await db.update(users).set({ photoAt: null }).where(eq(users.id, userId));
  revalidatePath("/profile");
}
