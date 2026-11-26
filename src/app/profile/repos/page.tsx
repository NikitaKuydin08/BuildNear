import { Suspense } from "react";
import Link from "next/link";
import { githubToken, listMyRepos } from "@/lib/github";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { getUser, listProjects } from "@/lib/queries";
import { requireUserId } from "@/lib/session";
import { importRepo } from "./actions";
import { removeProjectFromList } from "../actions";

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

  const [{ repos, hasInstallation }, mine] = await Promise.all([listMyRepos(me.githubLogin, token), listProjects(me.id)]);
  // A repo counts as added when a project with its name exists (the same rule the import uses to refuse duplicates).
  const added = new Map(mine.map((p) => [p.title, p]));
  // The app's own install page, where the person picks which private repos to share. Slug = github.com/apps/<slug>.
  const slug = process.env.GITHUB_APP_SLUG || "buildnear";
  const manage = `https://github.com/apps/${slug}/installations/new`;
  const error = typeof sp.error === "string" ? ERRORS[sp.error] : undefined;

  return (
    <>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {sp.removed && <p className="text-sm text-green-700 dark:text-green-400">Project removed.</p>}
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
            {added.has(r.name) ? (
              <form action={removeProjectFromList} className="mt-3 flex items-center justify-between gap-2">
                <input type="hidden" name="id" value={added.get(r.name)!.id} />
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  Added ✓{added.get(r.name)!.featured ? " as your proudest project" : ""}
                </p>
                <ConfirmSubmit message="Remove this project from your profile?" className="min-h-11 rounded-full border border-neutral-300 px-4 text-sm font-medium dark:border-neutral-700">
                  Remove
                </ConfirmSubmit>
              </form>
            ) : (
              <form action={importRepo} className="mt-3 flex gap-2">
                <input type="hidden" name="fullName" value={r.full_name} />
                <button name="as" value="proudest" className="min-h-11 flex-1 rounded-full bg-accent px-4 text-sm font-medium text-black">
                  Proudest project
                </button>
                <button name="as" value="other" className="min-h-11 flex-1 rounded-full border border-neutral-300 px-4 text-sm font-medium dark:border-neutral-700">
                  Add
                </button>
              </form>
            )}
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
