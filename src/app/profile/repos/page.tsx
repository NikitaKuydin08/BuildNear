import { Suspense } from "react";
import Link from "next/link";
import { githubToken, listMyRepos } from "@/lib/github";
import { getUser } from "@/lib/queries";
import { requireUserId } from "@/lib/session";
import { importRepo } from "./actions";

const ERRORS: Record<string, string> = {
  token: "GitHub access is missing. Sign out and sign in again, then come back here.",
  repo: "That repository could not be read.",
  dup: "That repository is already in your projects.",
  full: "You already have 3 other projects. Remove one on your profile first.",
};

async function RepoList({ searchParams }: { searchParams: PageProps<"/profile/repos">["searchParams"] }) {
  const sp = await searchParams;
  const me = await getUser(await requireUserId("/profile/repos"));
  const token = await githubToken();
  if (!me) return null;
  if (!token) return <p className="text-sm text-neutral-500">{ERRORS.token}</p>;

  const { repos, hasInstallation } = await listMyRepos(me.githubLogin, token);
  const slug = process.env.GITHUB_APP_SLUG;
  const manage = slug ? `https://github.com/apps/${slug}/installations/new` : "https://github.com/settings/installations";
  const error = typeof sp.error === "string" ? ERRORS[sp.error] : undefined;

  return (
    <>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-sm text-neutral-500">
        Pick a repository to add it as a project. Only its name, description (or the first paragraph of its README) and main language are copied, never its code. A private repository shows no link.
      </p>
      <a href={manage} target="_blank" rel="noreferrer" className="flex min-h-12 items-center justify-center rounded-full border border-neutral-300 px-6 text-sm font-medium dark:border-neutral-700">
        {hasInstallation ? "Give access to more repositories" : "Give access to private repositories"}
      </a>
      {repos.length === 0 && <p className="text-neutral-500">No repositories found.</p>}
      <ul className="flex flex-col gap-3">
        {repos.map((r) => (
          <li key={r.full_name} className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate font-medium">{r.name}</p>
              {r.private && <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs dark:bg-neutral-800">Private</span>}
            </div>
            {r.description && <p className="mt-1 text-sm text-neutral-500">{r.description}</p>}
            {r.language && <p className="mt-1 text-xs text-neutral-500">{r.language}</p>}
            <form action={importRepo} className="mt-3 flex gap-2">
              <input type="hidden" name="fullName" value={r.full_name} />
              <button name="as" value="proudest" className="min-h-11 flex-1 rounded-full bg-black px-4 text-sm font-medium text-white dark:bg-white dark:text-black">
                Proudest project
              </button>
              <button name="as" value="other" className="min-h-11 flex-1 rounded-full border border-neutral-300 px-4 text-sm font-medium dark:border-neutral-700">
                Add
              </button>
            </form>
          </li>
        ))}
      </ul>
    </>
  );
}

export default function ReposPage(props: PageProps<"/profile/repos">) {
  return (
    <main className="flex flex-col gap-4 p-4">
      <Link href="/profile" className="text-sm underline">← Back to profile</Link>
      <h1 className="text-2xl font-semibold">Import from GitHub</h1>
      <Suspense fallback={<p className="text-neutral-400">Loading…</p>}>
        <RepoList searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}
