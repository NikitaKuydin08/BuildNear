"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { syncProfile } from "@/lib/brain";
import { getUser } from "@/lib/queries";
import { requireUserId } from "@/lib/session";

const MEET = ["in_person", "open", "chat_first"];
const WORK = ["employed", "looking", "hiring"];

function parseList(value: FormDataEntryValue | null): string[] {
  const items = String(value ?? "")
    .split(",")
    .map((x) => x.trim().slice(0, 30))
    .filter(Boolean);
  return [...new Set(items)].slice(0, 12);
}

export async function saveProfile(formData: FormData) {
  const userId = await requireUserId();
  const meet = String(formData.get("meetPreference") ?? "open");
  const work = String(formData.get("workStatus") ?? "");

  await getDb()
    .update(users)
    .set({
      stack: parseList(formData.get("stack")),
      topics: parseList(formData.get("topics")),
      tags: parseList(formData.get("tags")),
      meetPreference: MEET.includes(meet) ? meet : "open",
      workStatus: WORK.includes(work) ? work : null,
    })
    .where(eq(users.id, userId));

  // Teach the Brain the new profile after the response is sent (never blocks the user).
  after(async () => {
    const u = await getUser(userId);
    if (u) await syncProfile(u);
  });

  revalidatePath("/profile");
  redirect("/profile?saved=1");
}
