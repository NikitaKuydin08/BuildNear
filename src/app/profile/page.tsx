import { Suspense } from "react";
import { txUrl } from "@/lib/chain";
import { getUser, listBadges } from "@/lib/queries";
import { signOut } from "@/auth";
import { isAdminLogin } from "@/lib/organizer";
import { requireUserId } from "@/lib/session";
import { saveProfile } from "./actions";

const input =
  "min-h-12 w-full rounded-xl border border-neutral-300 bg-transparent px-4 dark:border-neutral-700";

async function ProfileForm({ searchParams }: { searchParams: PageProps<"/profile">["searchParams"] }) {
  const sp = await searchParams;
  const userId = await requireUserId();
  const me = await getUser(userId);
  if (!me) return <p>Profile not found.</p>;

  return (
    <form action={saveProfile} className="flex flex-col gap-4">
      <div>
        <p className="text-lg font-medium">{me.name}</p>
        <p className="text-sm text-neutral-500">
          Your stack and topics come from your public GitHub. Edit them any time. Your contacts stay hidden until you approve an intro.
        </p>
      </div>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Stack (comma separated)
        <input name="stack" defaultValue={me.stack.join(", ")} className={input} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Fields you care about
        <input name="topics" defaultValue={me.topics.join(", ")} placeholder="ai, web3, sustainability" className={input} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Tags
        <input name="tags" defaultValue={me.tags.join(", ")} placeholder="frontend, hackathons" className={input} />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Meeting preference
        <select name="meetPreference" defaultValue={me.meetPreference} className={input}>
          <option value="in_person">Happy to meet in person</option>
          <option value="open">Open to meeting</option>
          <option value="chat_first">Chat first</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Work status (optional)
        <select name="workStatus" defaultValue={me.workStatus ?? ""} className={input}>
          <option value="">Prefer not to say</option>
          <option value="employed">Employed</option>
          <option value="looking">Looking for a job</option>
          <option value="hiring">Hiring</option>
        </select>
      </label>

      {sp.saved && <p className="text-sm text-green-700 dark:text-green-400">Saved.</p>}
      <button className="min-h-12 rounded-full bg-black px-6 font-medium text-white dark:bg-white dark:text-black" type="submit">
        Save
      </button>
    </form>
  );
}

async function AdminLink() {
  const me = await getUser(await requireUserId());
  if (!me || !isAdminLogin(me.githubLogin)) return null;
  return (
    <a href="/admin/events" className="flex min-h-12 items-center justify-center rounded-full border border-neutral-300 px-6 font-medium dark:border-neutral-700">
      Organizer tools
    </a>
  );
}

async function Badges() {
  const userId = await requireUserId();
  const rows = await listBadges(userId);
  if (rows.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-medium">Your badges</h2>
      <ul className="flex flex-col gap-2">
        {rows.map(({ badge, event }) => (
          <li key={event.id} className="flex items-center justify-between rounded-2xl border border-neutral-200 p-3 dark:border-neutral-800">
            <span className="text-sm font-medium">{event.title}</span>
            <a href={txUrl(badge.txHash)} target="_blank" rel="noreferrer" className="text-sm underline">
              BscScan
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function ProfilePage(props: PageProps<"/profile">) {
  return (
    <main className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">Profile</h1>
      <Suspense fallback={<p className="text-neutral-400">Loading…</p>}>
        <ProfileForm searchParams={props.searchParams} />
      </Suspense>
      <Suspense fallback={null}>
        <Badges />
      </Suspense>
      <Suspense fallback={null}>
        <AdminLink />
      </Suspense>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <button className="min-h-12 w-full rounded-full border border-neutral-300 px-6 font-medium dark:border-neutral-700" type="submit">
          Sign out
        </button>
      </form>
    </main>
  );
}
