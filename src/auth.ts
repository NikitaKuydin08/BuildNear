import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";

type GitHubProfile = {
  id: number;
  login: string;
  name?: string | null;
  avatar_url?: string | null;
};

type Repo = { language: string | null; topics?: string[]; fork: boolean };

// Builds a first guess of the user's stack and topics from their public repos.
// Failure is fine: the user can edit both on the profile page.
async function fetchStackFromGitHub(login: string, token?: string) {
  const url = `https://api.github.com/users/${encodeURIComponent(login)}/repos?per_page=100&sort=pushed&type=owner`;
  const headers = { Accept: "application/vnd.github+json" } as Record<string, string>;
  try {
    let res = await fetch(url, { headers: token ? { ...headers, Authorization: `Bearer ${token}` } : headers, cache: "no-store" });
    if (!res.ok && token) res = await fetch(url, { headers, cache: "no-store" });
    if (!res.ok) return { stack: [] as string[], topics: [] as string[] };

    const repos = ((await res.json()) as Repo[]).filter((r) => !r.fork);
    const langs = new Map<string, number>();
    const topics = new Map<string, number>();
    for (const r of repos) {
      if (r.language) langs.set(r.language, (langs.get(r.language) ?? 0) + 1);
      for (const t of r.topics ?? []) topics.set(t, (topics.get(t) ?? 0) + 1);
    }
    const top = (m: Map<string, number>, n: number) =>
      [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k);
    return { stack: top(langs, 6), topics: top(topics, 8) };
  } catch {
    return { stack: [] as string[], topics: [] as string[] };
  }
}

// AUTH_GITHUB_ID, AUTH_GITHUB_SECRET and AUTH_SECRET are read from the environment automatically.
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account, profile }) {
      // Runs with `account` and `profile` only at sign-in: upsert the user, keep our own id in the token.
      if (account && profile) {
        const gh = profile as unknown as GitHubProfile;
        const db = getDb();
        const [row] = await db
          .insert(users)
          .values({
            githubId: String(gh.id),
            githubLogin: gh.login,
            name: gh.name ?? gh.login,
            avatarUrl: gh.avatar_url ?? null,
          })
          .onConflictDoUpdate({
            target: users.githubId,
            set: { githubLogin: gh.login, name: gh.name ?? gh.login, avatarUrl: gh.avatar_url ?? null },
          })
          .returning({ id: users.id });
        token.uid = row.id;
        // Kept only in the encrypted session cookie (never in our database), so the repo picker can read the user's repos.
        if (account.access_token) token.ghToken = account.access_token;

        // Only fill stack/topics when still empty, so manual edits are never overwritten.
        const guess = await fetchStackFromGitHub(gh.login, account.access_token);
        if (guess.stack.length > 0 || guess.topics.length > 0) {
          await db
            .update(users)
            .set({ stack: guess.stack, topics: guess.topics })
            .where(and(eq(users.id, row.id), sql`cardinality(${users.stack}) = 0`));
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.uid) session.user.id = token.uid as string;
      return session;
    },
  },
});
