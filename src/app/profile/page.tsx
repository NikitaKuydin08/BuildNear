import { Suspense } from "react";
import Link from "next/link";
import { txUrl } from "@/lib/chain";
import { isAdminLogin } from "@/lib/organizer";
import { getUser, listBadges, listProjects } from "@/lib/queries";
import { signOut } from "@/auth";
import { requireUserId } from "@/lib/session";
import { deleteAccount, saveProfile } from "./actions";

const input =
  "min-h-12 w-full rounded-xl border border-neutral-300 bg-transparent px-4 dark:border-neutral-700";
const label = "flex flex-col gap-1 text-sm font-medium";
const hint = "text-xs font-normal text-neutral-500";

async function ProfileForm({ searchParams }: { searchParams: PageProps<"/profile">["searchParams"] }) {
  const sp = await searchParams;
  const userId = await requireUserId();
  const [me, mine] = await Promise.all([getUser(userId), listProjects(userId)]);
  if (!me) return <p>Profile not found.</p>;
  const slots = [0, 1, 2].map((i) => mine[i] ?? null);
  const featuredIndex = Math.max(0, mine.findIndex((p) => p.featured));

  return (
    <form action={saveProfile} className="flex flex-col gap-4">
      <div>
        <p className="text-lg font-medium">{me.name}</p>
        <p className="text-sm text-neutral-500">
          Your stack and topics come from your public GitHub. Edit them any time. Your contacts stay hidden until an intro is accepted.
        </p>
      </div>

      <label className={label}>
        Stack (comma separated)
        <input name="stack" defaultValue={me.stack.join(", ")} className={input} />
      </label>
      <label className={label}>
        Fields you care about
        <input name="topics" defaultValue={me.topics.join(", ")} placeholder="ai, web3, sustainability" className={input} />
      </label>
      <label className={label}>
        Tags
        <input name="tags" defaultValue={me.tags.join(", ")} placeholder="frontend, hackathons" className={input} />
      </label>

      <label className={label}>
        Meeting preference
        <select name="meetPreference" defaultValue={me.meetPreference} className={input}>
          <option value="in_person">Happy to meet in person</option>
          <option value="open">Open to meeting</option>
          <option value="chat_first">Chat first</option>
        </select>
      </label>

      <label className={label}>
        Work status (optional)
        <select name="workStatus" defaultValue={me.workStatus ?? ""} className={input}>
          <option value="">Prefer not to say</option>
          <option value="employed">Employed</option>
          <option value="looking">Looking for a job</option>
          <option value="hiring">Hiring</option>
        </select>
      </label>

      <section className="flex flex-col gap-3 rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
        <div>
          <h2 className="font-medium">Contacts to share</h2>
          <p className={hint}>Optional. Shown only to a person whose intro you accept (or who accepts yours). Never on cards.</p>
        </div>
        <label className={label}>Telegram<input name="telegram" defaultValue={me.telegram ? `@${me.telegram}` : ""} placeholder="@username" autoCapitalize="none" className={input} /></label>
        <label className={label}>WhatsApp<input name="whatsapp" defaultValue={me.whatsapp ?? ""} placeholder="+66 81 234 5678" inputMode="tel" className={input} /></label>
        <label className={label}>LinkedIn<input name="linkedin" defaultValue={me.linkedin ?? ""} placeholder="linkedin.com/in/you or just your handle" autoCapitalize="none" className={input} /></label>
        <label className={label}>Email<input name="contactEmail" type="email" defaultValue={me.contactEmail ?? ""} placeholder="you@example.com" autoCapitalize="none" className={input} /></label>
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="font-medium">Projects</h2>
          <p className={hint}>Up to 3. Pick the one you are proudest of: it shows on your card, so people have something to talk to you about.</p>
        </div>
        {slots.map((p, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="radio" name="featured" value={i} defaultChecked={i === featuredIndex} />
              Proudest project
            </label>
            <input name={`p${i}title`} defaultValue={p?.title ?? ""} placeholder="Title" maxLength={60} className={input} />
            <input name={`p${i}desc`} defaultValue={p?.description ?? ""} placeholder="One line about it" maxLength={140} className={input} />
            <input name={`p${i}stack`} defaultValue={p?.stack.join(", ") ?? ""} placeholder="Stack (comma separated)" className={input} />
            <input name={`p${i}url`} defaultValue={p?.url ?? ""} placeholder="Link (optional, https://…)" autoCapitalize="none" className={input} />
          </div>
        ))}
      </section>

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

async function YourData({ searchParams }: { searchParams: PageProps<"/profile">["searchParams"] }) {
  const sp = await searchParams;
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
      <h2 className="font-medium">Your data</h2>
      <p className={hint}>
        See what we store and why in the <Link href="/privacy" className="underline">privacy notice</Link>.
      </p>
      <a href="/api/me/export" className="flex min-h-12 items-center justify-center rounded-full border border-neutral-300 px-6 text-sm font-medium dark:border-neutral-700">
        Download my data
      </a>
      <form action={deleteAccount} className="flex flex-col gap-2">
        <label className={label}>
          Delete my account and data
          <span className={hint}>Type DELETE to confirm. This removes your profile, check-ins, requests and projects. It cannot be undone.</span>
          <input name="confirm" autoComplete="off" autoCapitalize="characters" placeholder="DELETE" className={input} />
        </label>
        {sp.error === "confirm" && <p className="text-sm text-red-600">Type DELETE exactly to confirm.</p>}
        <button className="min-h-12 rounded-full border border-red-300 px-6 text-sm font-medium text-red-700 dark:border-red-900 dark:text-red-400" type="submit">
          Delete my account
        </button>
      </form>
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
      <Suspense fallback={null}>
        <YourData searchParams={props.searchParams} />
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
