import { Suspense } from "react";
import Link from "next/link";
import { signOut } from "@/auth";
import { DeleteAccountButton } from "@/components/DeleteAccountButton";
import { txUrl } from "@/lib/chain";
import { FIELD_KEYS, FIELDS } from "@/lib/fields";
import { isAdminLogin } from "@/lib/organizer";
import { BadgeShelf } from "@/components/BadgeShelf";
import { fieldProgress, getUser, listBadges, listProjects } from "@/lib/queries";
import { requireUserId } from "@/lib/session";
import { OtherProjects } from "@/components/OtherProjects";
import { PhotoUpload } from "@/components/PhotoUpload";
import { ProudestProject } from "@/components/ProudestProject";
import { saveProfile } from "./actions";

const input = "min-h-12 w-full rounded-xl border border-neutral-300 bg-transparent px-4 dark:border-neutral-700";
const label = "flex flex-col gap-1 text-sm font-medium";
const hint = "text-xs font-normal text-neutral-500";
const card = "flex flex-col gap-3 rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800";
const outlineBtn = "flex min-h-12 w-full items-center justify-center rounded-full border border-neutral-300 px-6 font-medium dark:border-neutral-700";

async function ProfileForm({ searchParams }: { searchParams: PageProps<"/profile">["searchParams"] }) {
  const sp = await searchParams;
  const userId = await requireUserId();
  const [me, mine] = await Promise.all([getUser(userId), listProjects(userId)]);
  if (!me) return <p>Profile not found.</p>;

  const proudest = mine.find((p) => p.featured) ?? null;
  const others = mine.filter((p) => !p.featured);
  const chosen = new Set(me.topics);
  const extraTopics = me.topics.filter((t) => !FIELD_KEYS.includes(t));

  return (
    <form action={saveProfile} className="flex flex-col gap-4">
      <section className={card}>
        <PhotoUpload userId={me.id} name={me.name} photoAt={me.photoAt ? me.photoAt.getTime() : null} />
        <div>
          <p className="text-lg font-medium">{me.name}</p>
          <p className="text-sm text-neutral-500">Your stack comes from your public GitHub. Edit anything. Your contacts stay hidden until an intro is accepted.</p>
          <Link href={`/people/${me.id}`} className="text-sm underline">See how others see you</Link>
        </div>
      </section>

      <section className={card}>
        <div>
          <h2 className="font-medium">Fields you care about</h2>
          <p className={hint}>Tap all that fit. These are used to find people you would click with.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {FIELDS.map((f) => (
            <label key={f.key} className="cursor-pointer">
              <input type="checkbox" name="field" value={f.key} defaultChecked={chosen.has(f.key)} className="peer sr-only" />
              <span
                style={{ ["--c" as string]: f.color }}
                className="block rounded-full border border-neutral-300 px-4 py-2 text-sm peer-checked:border-transparent peer-checked:bg-(--c) peer-checked:font-medium peer-checked:text-black peer-focus-visible:ring-2 dark:border-neutral-700"
              >
                {f.label}
              </span>
            </label>
          ))}
        </div>
        <label className={label}>
          Something else? (comma separated)
          <input name="topicsOther" defaultValue={extraTopics.join(", ")} className={input} />
        </label>
      </section>

      <section className={card}>
        <h2 className="font-medium">About you</h2>
        <label className={label}>
          Stack (comma separated)
          <input name="stack" defaultValue={me.stack.join(", ")} className={input} />
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
      </section>

      <section className={card}>
        <div>
          <h2 className="font-medium">Your proudest project</h2>
          <p className={hint}>The one thing you want people to ask you about. It appears at the top of your profile and on your card.</p>
        </div>
        <ProudestProject
          initial={proudest ? { id: proudest.id, title: proudest.title, description: proudest.description, stack: proudest.stack.join(", "), url: proudest.url ?? "" } : null}
        />
      </section>

      <section className={card}>
        <div>
          <h2 className="font-medium">Other projects</h2>
          <p className={hint}>Up to 3. They appear on your profile, below your proudest project.</p>
        </div>
        <OtherProjects
          initial={others.slice(0, 3).map((p) => ({ id: p.id, title: p.title, description: p.description, stack: p.stack.join(", "), url: p.url ?? "" }))}
        />
      </section>

      <section className={card}>
        <div>
          <h2 className="font-medium">Contacts to share</h2>
          <p className={hint}>Optional. Shown only to a person whose intro you accept (or who accepts yours). Never on cards.</p>
        </div>
        <label className={label}>Telegram<input name="telegram" defaultValue={me.telegram ? `@${me.telegram}` : ""} placeholder="@username" autoCapitalize="none" className={input} /></label>
        <label className={label}>WhatsApp<input name="whatsapp" defaultValue={me.whatsapp ?? ""} placeholder="+66 81 234 5678" inputMode="tel" className={input} /></label>
        <label className={label}>LinkedIn<input name="linkedin" defaultValue={me.linkedin ?? ""} placeholder="linkedin.com/in/you or just your handle" autoCapitalize="none" className={input} /></label>
        <label className={label}>Email<input name="contactEmail" type="email" defaultValue={me.contactEmail ?? ""} placeholder="you@example.com" autoCapitalize="none" className={input} /></label>
      </section>

      {sp.saved && <p className="text-sm text-green-700 dark:text-green-400">Saved.</p>}
      <button className="min-h-12 rounded-full bg-accent px-6 font-medium text-black" type="submit">
        Save
      </button>
    </form>
  );
}

async function AdminLink() {
  const me = await getUser(await requireUserId());
  if (!me || !isAdminLogin(me.githubLogin)) return null;
  return <a href="/admin/events" className={outlineBtn}>Organizer tools</a>;
}

async function Badges() {
  const userId = await requireUserId();
  const [rows, progress] = await Promise.all([listBadges(userId), fieldProgress(userId)]);
  if (rows.length === 0 && progress.length === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-medium">Your badges</h2>
      <BadgeShelf rows={progress} showNext />
      {rows.length > 0 && (
        <>
          <p className="text-xs uppercase tracking-wide text-neutral-500">Event badges on BNB chain</p>
          <ul className="flex flex-col gap-2">
            {rows.map(({ badge, event }) => (
              <li key={event.id} className="flex items-center justify-between rounded-2xl border border-neutral-200 p-3 dark:border-neutral-800">
                <span className="text-sm font-medium">{event.title}</span>
                <a href={txUrl(badge.txHash)} target="_blank" rel="noreferrer" className="text-sm underline">BscScan</a>
              </li>
            ))}
          </ul>
        </>
      )}
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
      <div className="flex flex-col gap-3">
        <a href="/api/me/export" className={outlineBtn}>Download my data</a>
        <DeleteAccountButton />
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button className={outlineBtn} type="submit">Sign out</button>
        </form>
      </div>
    </main>
  );
}
