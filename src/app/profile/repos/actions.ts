"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { projects } from "@/db/schema";
import { getRepo, githubToken, readmeIntro } from "@/lib/github";
import { getUser } from "@/lib/queries";
import { requireUserId } from "@/lib/session";

const MAX_OTHERS = 3;

// Adds one repo as a project. The repo is read again from GitHub with the user's own token,
// so only repos the user can really access are accepted, and nothing from the browser is trusted.
export async function importRepo(formData: FormData) {
  const userId = await requireUserId("/profile/repos");
  const me = await getUser(userId);
  const token = await githubToken();
  if (!me || !token) redirect("/profile/repos?error=token");

  const repo = await getRepo(String(formData.get("fullName") ?? ""), token);
  if (!repo) redirect("/profile/repos?error=repo");
  if (repo.owner.login.toLowerCase() !== me.githubLogin.toLowerCase() && !repo.permissions?.push) redirect("/profile/repos?error=repo");

  const featured = formData.get("as") === "proudest";
  const db = getDb();
  const mine = await db.select().from(projects).where(eq(projects.userId, userId));
  if (mine.some((p) => p.title === repo.name)) redirect("/profile/repos?error=dup");
  if (!featured && mine.filter((p) => !p.featured).length >= MAX_OTHERS) redirect("/profile/repos?error=full");

  if (featured) await db.update(projects).set({ featured: false }).where(and(eq(projects.userId, userId), eq(projects.featured, true)));
  await db.insert(projects).values({
    userId,
    title: repo.name.slice(0, 60),
    description: (repo.description ?? "").trim() ? repo.description!.slice(0, 140) : await readmeIntro(repo.full_name, token),
    stack: [repo.language, ...(repo.topics ?? [])].filter((x): x is string => !!x).slice(0, 6),
    // A private repo's link would not open for anyone else, so none is stored.
    url: repo.private ? null : repo.html_url,
    visibility: repo.private ? "private" : "public",
    featured,
  });
  revalidatePath("/profile");
  redirect("/profile?saved=1");
}
