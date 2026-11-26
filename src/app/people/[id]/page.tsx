import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { BadgeShelf } from "@/components/BadgeShelf";
import { IntroControl } from "@/components/IntroControl";
import { MEET_BAND } from "@/components/PersonCard";
import { BackBar, Chips, Icon, SectionLabel, Screen, btnSecondary } from "@/components/ui";
import { FIELDS } from "@/lib/fields";
import type { MeetPreference } from "@/lib/match";
import { canConnect, fieldProgress, getUser, introStatesFor, listProjects } from "@/lib/queries";
import { requireUserId } from "@/lib/session";

const WORK: Record<string, string> = { employed: "Employed", looking: "Looking for a job", hiring: "Hiring" };

// A builder's full profile (no Figma screen: built from the card's parts). Contacts are never here;
// they appear in the chat after an accepted introduction.
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
  const curious = [...person.topics.map((t) => FIELDS.find((f) => f.key === t)?.label ?? t), ...person.tags];

  return (
    <Screen>
      <div className="overflow-hidden rounded-[22px] bg-card">
        <div className="h-20 bg-lavender px-5 pt-5">
          <p className="text-[10px] font-semibold uppercase tracking-[1.2px] text-purple">{MEET_BAND[person.meetPreference as MeetPreference] ?? ""}</p>
        </div>
        <div className="px-5 pb-5">
          <div className="-mt-6"><Avatar userId={person.id} name={person.name} photoAt={person.photoAt} size={80} /></div>
          <h1 className="mt-4 text-[26px] font-semibold leading-[32px] tracking-[-0.4px]">{person.name}</h1>
          {person.workStatus && <p className="mt-1 text-[13px] text-muted">{WORK[person.workStatus]}</p>}
          {person.stack.length > 0 && (
            <>
              <SectionLabel className="mt-5">Builds with · From GitHub</SectionLabel>
              <div className="mt-2.5"><Chips items={person.stack} max={12} /></div>
            </>
          )}
          {curious.length > 0 && (
            <>
              <SectionLabel className="mt-5">Curious about</SectionLabel>
              <div className="mt-2.5"><Chips items={curious} tone="lilac" max={12} /></div>
            </>
          )}
        </div>
      </div>

      {proudest && (
        <section className="mt-4 rounded-[18px] bg-card p-5">
          <SectionLabel>Proudest project{proudest.visibility === "private" ? " · private" : ""}</SectionLabel>
          <p className="mt-2 text-[18px] font-semibold">{proudest.title}</p>
          {proudest.description && <p className="mt-1 text-[14px] leading-[20px] text-muted">{proudest.description}</p>}
          {proudest.stack.length > 0 && <div className="mt-3"><Chips items={proudest.stack} /></div>}
          {proudest.url && (
            <a href={proudest.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-purple">
              Open link <Icon name="external" size={14} />
            </a>
          )}
        </section>
      )}

      {others.length > 0 && (
        <section className="mt-6">
          <SectionLabel>Other projects</SectionLabel>
          <div className="mt-3 flex flex-col gap-3">
            {others.map((p) => (
              <div key={p.id} className="rounded-[16px] bg-card p-4">
                <p className="text-[15px] font-semibold">{p.title}</p>
                {p.description && <p className="mt-1 text-[13px] text-muted">{p.description}</p>}
                {p.url && (
                  <a href={p.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-purple">
                    Open link <Icon name="external" size={12} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {progress.length > 0 && (
        <section className="mt-6">
          <SectionLabel>Badges</SectionLabel>
          <div className="mt-3"><BadgeShelf rows={progress} /></div>
        </section>
      )}

      <div className="mt-8">
        {isMe ? (
          <Link href="/profile" className={btnSecondary}>Edit my profile</Link>
        ) : (
          <IntroControl toUserId={id} back={`/people/${id}`} state={states.get(id)} />
        )}
      </div>
    </Screen>
  );
}

export default function PersonPage(props: PageProps<"/people/[id]">) {
  return (
    <>
      <BackBar href="/people" title="Builder profile" />
      <Suspense fallback={<p className="p-5 text-muted">Loading…</p>}>
        <Profile params={props.params} />
      </Suspense>
    </>
  );
}
