import { Suspense } from "react";
import Link from "next/link";
import { IntroControl } from "@/components/IntroControl";
import { PersonCard } from "@/components/PersonCard";
import { brainEnabled, brainPicks } from "@/lib/brain";
import { scorePair, type MeetPreference, type Person, type WorkStatus } from "@/lib/match";
import { isHere } from "@/lib/presence";
import { rerankWithBrain } from "@/lib/rerank";
import { featuredFor, getUser, introStatesFor, listAttendees } from "@/lib/queries";

export type Tab = "everyone" | "for-you" | "brain";

// `base` is the page this feed lives on, e.g. "/events/<slug>" or "/people?event=<slug>".
export function tabHref(base: string, tab: Tab) {
  if (tab === "everyone") return base;
  return `${base}${base.includes("?") ? "&" : "?"}tab=${tab}`;
}

function toPerson(u: {
  stack: string[];
  topics: string[];
  tags: string[];
  meetPreference: string;
  workStatus: string | null;
}): Person {
  return {
    stack: u.stack,
    topics: u.topics,
    tags: u.tags,
    meetPreference: u.meetPreference as MeetPreference,
    workStatus: u.workStatus as WorkStatus,
  };
}

// Everyone / For you / Brain for one event. Shared by the home screen and the event page.
export function PeopleFeed({ eventId, endsAt, base, meId, tab }: { eventId: string; endsAt: Date; base: string; meId: string; tab: Tab }) {
  const tabs: { id: Tab; label: string }[] = [
    { id: "everyone", label: "Everyone" },
    { id: "for-you", label: "For you" },
    ...(brainEnabled() ? [{ id: "brain" as Tab, label: "Brain" }] : []),
  ];
  return (
    <>
      <div className="flex gap-2 rounded-full bg-neutral-100 p-1 dark:bg-neutral-900">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={tabHref(base, t.id)}
            className={`flex min-h-10 flex-1 items-center justify-center rounded-full text-sm font-medium ${
              tab === t.id ? "bg-white shadow dark:bg-neutral-800" : "text-neutral-500"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>
      <Suspense fallback={<p className="text-neutral-400">Loading people…</p>}>
        <Feed eventId={eventId} endsAt={endsAt} base={base} meId={meId} tab={tab} />
      </Suspense>
    </>
  );
}

async function Feed({ eventId, endsAt, base, meId, tab }: { eventId: string; endsAt: Date; base: string; meId: string; tab: Tab }) {
  const [me, rows] = await Promise.all([getUser(meId), listAttendees(eventId, meId)]);
  if (rows.length === 0) return <p className="text-neutral-500">No one else has checked in yet.</p>;
  const ids = rows.map((r) => r.user.id);
  const [states, projectsBy] = await Promise.all([introStatesFor(meId, ids), featuredFor(ids)]);
  const back = tabHref(base, tab);

  // The Brain tab only uses the Brain for the similarity score. The text shown comes from our own profile data:
  // the Brain's page summaries can mention who connected with whom, which must never be shown to other people.
  if (tab === "brain" && me) {
    const picks = await brainPicks(
      me,
      rows.map((r) => ({ id: r.user.id, name: r.user.name, githubLogin: r.user.githubLogin })),
    );
    if (!picks) {
      return <p className="text-neutral-500">The Brain isn't reachable right now. The "For you" tab still works.</p>;
    }
    const known = rows
      .filter((r) => picks.has(r.user.id))
      .sort((a, b) => picks.get(b.user.id)!.similarity - picks.get(a.user.id)!.similarity);
    if (known.length === 0) {
      return (
        <p className="text-neutral-500">
          The Brain hasn't learned about the people here yet. New profiles take a minute or two to be understood.
        </p>
      );
    }
    return (
      <ul className="flex flex-col gap-3">
        {known.map(({ user, checkedInAt, leftAt }) => (
          <PersonCard
            key={user.id}
            userId={user.id}
            photoAt={user.photoAt}
            name={user.name}
            stack={user.stack}
            topics={user.topics}
            meetPreference={user.meetPreference as MeetPreference}
            hereNow={isHere(checkedInAt, leftAt, endsAt)}
            project={projectsBy.get(user.id)}
            why={scorePair(toPerson(me), toPerson(user)).why}
            brainMatch={picks.get(user.id)!.similarity}
          >
            <IntroControl toUserId={user.id} back={back} state={states.get(user.id)} />
          </PersonCard>
        ))}
      </ul>
    );
  }

  if (tab === "for-you" && me) {
    const mine = toPerson(me);
    const plain = rows
      .map((r) => ({ ...r, match: scorePair(mine, toPerson(r.user)) }))
      .sort((a, b) => b.match.score - a.match.score);
    // The Brain re-ranks the top few; if it is off or slow, the plain ranking is used as is.
    const { list: ranked } = await rerankWithBrain(me, plain);
    return (
      <ul className="flex flex-col gap-3">
        {ranked.map(({ user, checkedInAt, leftAt, match, brain, note }) => (
          <PersonCard
            key={user.id}
            userId={user.id}
            photoAt={user.photoAt}
            name={user.name}
            stack={user.stack}
            topics={user.topics}
            meetPreference={user.meetPreference as MeetPreference}
            hereNow={isHere(checkedInAt, leftAt, endsAt)}
            project={projectsBy.get(user.id)}
            why={match.why}
            action={match.action}
            brainMatch={brain}
            rankNote={note}
          >
            <IntroControl toUserId={user.id} back={back} state={states.get(user.id)} />
          </PersonCard>
        ))}
      </ul>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {rows.map(({ user, checkedInAt, leftAt }) => (
        <PersonCard
          key={user.id}
          userId={user.id}
            photoAt={user.photoAt}
            name={user.name}
          stack={user.stack}
          topics={user.topics}
          meetPreference={user.meetPreference as MeetPreference}
          hereNow={isHere(checkedInAt, leftAt, endsAt)}
            project={projectsBy.get(user.id)}
        >
          <IntroControl toUserId={user.id} back={back} state={states.get(user.id)} />
        </PersonCard>
      ))}
    </ul>
  );
}

