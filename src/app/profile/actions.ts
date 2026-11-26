"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { signOut } from "@/auth";
import { getDb } from "@/db";
import { projects, users } from "@/db/schema";
import { syncProfile } from "@/lib/brain";
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
      topics: parseList(formData.get("topics")),
      tags: parseList(formData.get("tags")),
      meetPreference: MEET.includes(meet) ? meet : "open",
      workStatus: WORK.includes(work) ? work : null,
      telegram: optional(formData.get("telegram"), cleanTelegram),
      whatsapp: optional(formData.get("whatsapp"), cleanWhatsapp),
      linkedin: optional(formData.get("linkedin"), cleanLinkedin),
      contactEmail: optional(formData.get("contactEmail"), cleanEmail),
    })
    .where(eq(users.id, userId));

  // Up to 3 projects. The one chosen as "proudest" is featured on the person's card.
  const rows: (typeof projects.$inferInsert)[] = [];
  const chosen = String(formData.get("featured") ?? "0");
  for (let i = 0; i < 3; i++) {
    const title = String(formData.get(`p${i}title`) ?? "").trim().slice(0, 60);
    if (!title) continue;
    const url = String(formData.get(`p${i}url`) ?? "").trim();
    rows.push({
      userId,
      title,
      description: String(formData.get(`p${i}desc`) ?? "").trim().slice(0, 140),
      stack: parseList(formData.get(`p${i}stack`), 8),
      url: /^https?:\/\//i.test(url) ? url.slice(0, 200) : null,
      featured: chosen === String(i),
    });
  }
  if (rows.length > 0 && !rows.some((r) => r.featured)) rows[0].featured = true;
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
export async function deleteAccount(formData: FormData) {
  const userId = await requireUserId();
  if (String(formData.get("confirm") ?? "").trim() !== "DELETE") redirect("/profile?error=confirm");
  await getDb().delete(users).where(eq(users.id, userId));
  await signOut({ redirectTo: "/?deleted=1" });
}
