import { getToken } from "next-auth/jwt";
import { headers } from "next/headers";

// Reads the GitHub token that sign-in stored in the encrypted session cookie.
// It never goes to the browser's JavaScript and is never written to the database.
export async function githubToken(): Promise<string | null> {
  const h = await headers();
  const secure = (h.get("x-forwarded-proto") ?? "http") === "https";
  const salt = secure ? "__Secure-authjs.session-token" : "authjs.session-token";
  const t = await getToken({ req: { headers: h }, secret: process.env.AUTH_SECRET, salt, secureCookie: secure });
  return typeof t?.ghToken === "string" ? t.ghToken : null;
}

export type Repo = {
  full_name: string;
  name: string;
  description: string | null;
  language: string | null;
  topics?: string[];
  private: boolean;
  html_url: string;
  fork: boolean;
  pushed_at: string | null;
  owner: { login: string };
  permissions?: { push?: boolean; admin?: boolean };
};

async function gh<T>(path: string, token: string): Promise<T | null> {
  try {
    const res = await fetch(`https://api.github.com${path}`, {
      headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": "2022-11-28" },
      cache: "no-store",
    });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

// Public repos of the user, plus any repo (private too) in an installation of this GitHub App that the user can access.
export async function listMyRepos(login: string, token: string) {
  const out = new Map<string, Repo>();
  const pub = await gh<Repo[]>(`/users/${encodeURIComponent(login)}/repos?type=owner&sort=pushed&per_page=60`, token);
  for (const r of pub ?? []) if (!r.fork) out.set(r.full_name, r);

  const inst = await gh<{ installations: { id: number }[] }>("/user/installations?per_page=20", token);
  for (const i of inst?.installations ?? []) {
    const repos = await gh<{ repositories: Repo[] }>(`/user/installations/${i.id}/repositories?per_page=100`, token);
    for (const r of repos?.repositories ?? []) if (!r.fork) out.set(r.full_name, r);
  }
  const hasInstallation = (inst?.installations.length ?? 0) > 0;
  return { repos: [...out.values()].sort((a, b) => (b.pushed_at ?? "").localeCompare(a.pushed_at ?? "")), hasInstallation };
}

export async function getRepo(fullName: string, token: string) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(fullName)) return null;
  return gh<Repo>(`/repos/${fullName}`, token);
}

// First real paragraph of the README, used as the project description when the repo has none.
// Skips headings, badges, images and HTML. Returns "" if there is no README or nothing usable.
export async function readmeIntro(fullName: string, token: string): Promise<string> {
  if (!/^[\w.-]+\/[\w.-]+$/.test(fullName)) return "";
  try {
    const res = await fetch(`https://api.github.com/repos/${fullName}/readme`, {
      headers: { Accept: "application/vnd.github.raw+json", Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": "2022-11-28" },
      cache: "no-store",
    });
    if (!res.ok) return "";
    const text = (await res.text()).slice(0, 8000);
    for (const block of text.split(/\n\s*\n/)) {
      const clean = block
        .replace(/<[^>]+>/g, " ")
        .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/[`*_>#]/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (clean.length >= 30 && !/^(table of contents|license|installation)/i.test(clean) && !block.trimStart().startsWith("#")) {
        return clean.slice(0, 140);
      }
    }
  } catch {}
  return "";
}
