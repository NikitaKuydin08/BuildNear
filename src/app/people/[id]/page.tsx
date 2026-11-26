import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { IntroControl } from "@/components/IntroControl";
import { FIELDS } from "@/lib/fields";
import { BadgeShelf } from "@/components/BadgeShelf";
import { canConnect, fieldProgress, getUser, introStatesFor, listProjects } from "@/lib/queries";
import { requireUserId } from "@/lib/session";

const MEET: Record<string, string> = { in_person: "Happy to meet in person", open: "Open to meeting", chat_first: "Chat first" };
const WORK: Record<string, string> = { employed: "Employed", looking: "Looking for a job", hiring: "Hiring" };

// What other people see: picture, fields, stack, projects. Contacts are never here; they appear in the Inbox after an accepted intro.
async function Profile({ params }: { params: PageProps<"/people/[id]">["params"] }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const meId = await requireUserId(`/people/${id}`);
  const isMe = meId === id;

  const [person, projects, progress] = await Promise.all([getUser(id), listProjects(id), fieldProgress(id)]);
  if (!person) notFound();

  const states = isMe ? new Map() : await introStatesFor(meId, [id]);
  // You may look at someone you share an event with, are nearby, or already have an intro with.
  if (!isMe && !(await canConnect(meId, id)).allowed && !states.get(id)) notFound();

  const proudest = projects.find((p) => p.featured);
  const others = projects.filter((p) => !p.featured);
  const fieldChips = person.topics.map((t) => FIELDS.find((f) => f.key === t)).filter((f) => !!f);
  const extraTopics = person.topics.filter((t) => !FIELDS.some((f) => f.key === t));

  return (
    <>
      <div className="flex items-center gap-4">
        <Avatar userId={person.id} name={person.name} photoAt={person.photoAt} size={80} />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold">{person.name}</h1>
          <p className="text-sm text-neutral-500">
            {MEET[person.meetPreference] ?? ""}
            {person.workStatus ? ` · ${WORK[person.workStatus]}` : ""}
          </p>
        </div>
      </div>

      {(fieldChips.length > 0 || extraTopics.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {fieldChips.map((f) => (
            <span key={f.key} style={{ backgroundColor: f.color }} className="rounded-full px-3 py-1 text-sm font-medium text-black">{f.label}</span>
          ))}
          {extraTopics.map((t) => (
            <span key={t} className="rounded-full bg-neutral-100 px-3 py-1 text-sm dark:bg-neutral-800">{t}</span>
          ))}
        </div>
      )}

      <BadgeShelf rows={progress} />

      {person.stack.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {person.stack.map((s) => (
            <span key={s} className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs dark:bg-neutral-800">{s}</span>
          ))}
        </div>
      )}

      {proudest && (
        <section className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Proudest project</p>
          <p className="mt-1 text-lg font-medium">{proudest.title}</p>
          {proudest.description && <p className="text-sm text-neutral-500">{proudest.description}</p>}
          {proudest.stack.length > 0 && <p className="mt-1 text-xs text-neutral-500">{proudest.stack.join(", ")}</p>}
          {proudest.url && <a href={proudest.url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm underline">Open link</a>}
        </section>
      )}

      {others.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-medium">Other projects</h2>
          {others.map((p) => (
            <div key={p.id} className="rounded-2xl border border-neutral-200 p-3 dark:border-neutral-800">
              <p className="text-sm font-medium">{p.title}</p>
              {p.description && <p className="text-sm text-neutral-500">{p.description}</p>}
              {p.url && <a href={p.url} target="_blank" rel="noreferrer" className="text-xs underline">Open link</a>}
            </div>
          ))}
        </section>
      )}

      {isMe ? (
        <Link href="/profile" className="flex min-h-12 items-center justify-center rounded-full border border-neutral-300 px-6 font-medium dark:border-neutral-700">Edit my profile</Link>
      ) : (
        <IntroControl toUserId={id} back={`/people/${id}`} state={states.get(id)} />
      )}
    </>
  );
}

export default function PersonPage(props: PageProps<"/people/[id]">) {
  return (
    <main className="flex flex-col gap-4 p-4">
      <Link href="/events" className="text-sm underline">← Events</Link>
      <Suspense fallback={<p className="text-neutral-400">Loading…</p>}>
        <Profile params={props.params} />
      </Suspense>
    </main>
  );
}
