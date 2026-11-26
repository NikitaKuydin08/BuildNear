import { Suspense } from "react";
import Link from "next/link";
import { signOut } from "@/auth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BackBar, Eyebrow, Screen, Title, btnPrimary, btnSecondary, firstName, inputCls } from "@/components/ui";
import { DeleteAccountButton } from "@/components/DeleteAccountButton";
import { FIELD_KEYS, FIELDS } from "@/lib/fields";
import { isAdminLogin } from "@/lib/organizer";
import { getUser, listProjects } from "@/lib/queries";
import { requireUserId } from "@/lib/session";
import { OtherProjects } from "@/components/OtherProjects";
import { PhotoUpload } from "@/components/PhotoUpload";
import { ProudestProject } from "@/components/ProudestProject";
import { saveProfile } from "./actions";

// Your builder profile. The Figma kit only has the review step (02); this full editor uses the same parts.
const input = inputCls;
const label = "flex flex-col gap-2 text-[11px] font-semibold uppercase tracking-[1.1px] text-muted";
const hint = "mt-1 text-[12px] font-normal normal-case tracking-normal text-muted";
const card = "flex flex-col gap-4 rounded-[18px] bg-card p-5";
const outlineBtn = btnSecondary;

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
          <p className="text-[18px] font-semibold">{me.name}</p>
          <p className="text-[12px] text-muted">@{me.githubLogin} · From GitHub</p>
          <p className="mt-2 text-[13px] leading-[19px] text-muted">Your stack comes from your public GitHub. Edit anything. Your contacts stay hidden until an intro is accepted.</p>
          <Link href={`/people/${me.id}`} className="mt-2 inline-block text-[13px] font-semibold text-purple">See how others see you</Link>
        </div>
      </section>

      <section className={card}>
        <div>
          <h2 className="text-[17px] font-semibold">Fields you care about</h2>
          <p className={hint}>Tap all that fit. These are used to find people you would click with.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {FIELDS.map((f) => (
            <label key={f.key} className="cursor-pointer">
              <input type="checkbox" name="field" value={f.key} defaultChecked={chosen.has(f.key)} className="peer sr-only" />
              <span
                style={{ ["--c" as string]: f.color }}
                className="flex h-[34px] items-center rounded-[8px] border border-line bg-card px-3 text-[13px] text-muted peer-checked:border-transparent peer-checked:bg-(--c) peer-checked:font-semibold peer-checked:text-black peer-focus-visible:ring-2"
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
        <h2 className="text-[17px] font-semibold">About you</h2>
        <label className={label}>
          Builds with (comma separated)
          <input name="stack" defaultValue={me.stack.join(", ")} className={input} />
        </label>
        <label className={label}>
          I want to explore
          <input name="tags" defaultValue={me.tags.join(", ")} placeholder="Creative tools, product design" className={input} />
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
          <h2 className="text-[17px] font-semibold">Your proudest project</h2>
          <p className={hint}>The one thing you want people to ask you about. It appears at the top of your profile and on your card.</p>
        </div>
        <ProudestProject
          initial={proudest ? { id: proudest.id, title: proudest.title, description: proudest.description, stack: proudest.stack.join(", "), url: proudest.url ?? "" } : null}
        />
      </section>

      <section className={card}>
        <div>
          <h2 className="text-[17px] font-semibold">Other projects</h2>
          <p className={hint}>Up to 3. They appear on your profile, below your proudest project.</p>
        </div>
        <OtherProjects
          initial={others.slice(0, 3).map((p) => ({ id: p.id, title: p.title, description: p.description, stack: p.stack.join(", "), url: p.url ?? "" }))}
        />
      </section>

      <section className={card}>
        <div>
          <h2 className="text-[17px] font-semibold">Contacts to share</h2>
          <p className={hint}>Optional. Shown only to a person whose intro you accept (or who accepts yours). Never on cards.</p>
        </div>
        <label className={label}>Telegram<input name="telegram" defaultValue={me.telegram ? `@${me.telegram}` : ""} placeholder="@username" autoCapitalize="none" className={input} /></label>
        <label className={label}>WhatsApp<input name="whatsapp" defaultValue={me.whatsapp ?? ""} placeholder="+66 81 234 5678" inputMode="tel" className={input} /></label>
        <label className={label}>LinkedIn<input name="linkedin" defaultValue={me.linkedin ?? ""} placeholder="linkedin.com/in/you or just your handle" autoCapitalize="none" className={input} /></label>
        <label className={label}>Email<input name="contactEmail" type="email" defaultValue={me.contactEmail ?? ""} placeholder="you@example.com" autoCapitalize="none" className={input} /></label>
      </section>

      {sp.saved && <p className="text-[13px] font-semibold text-purple">Saved.</p>}
      <button className={btnPrimary} type="submit">
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

async function Hello() {
  const me = await getUser(await requireUserId("/profile"));
  return (
    <Title size={32} className="mt-3">
      Nice to meet
      <br />
      you, {me ? firstName(me.name) : "builder"}.
    </Title>
  );
}

export default function ProfilePage(props: PageProps<"/profile">) {
  return (
    <>
      <BackBar href="/people" title="Your builder profile" />
      <Screen className="gap-4">
      <div className="mb-3">
        <Eyebrow className="mt-2">Make it yours</Eyebrow>
        <Suspense fallback={null}>
          <Hello />
        </Suspense>
      </div>
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <ProfileForm searchParams={props.searchParams} />
      </Suspense>
      <div className="flex min-h-[52px] items-center justify-between rounded-[14px] bg-card px-4">
        <span className="text-[15px] font-semibold">Dark mode</span>
        <ThemeToggle />
      </div>
      <Link href="/badges" className={outlineBtn}>My badges</Link>
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
      </Screen>
    </>
  );
}
