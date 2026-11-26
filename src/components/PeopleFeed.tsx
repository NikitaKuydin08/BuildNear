import { Suspense } from "react";
import Link from "next/link";
import { FeedFilters } from "@/components/FeedFilters";
import { IntroControl } from "@/components/IntroControl";
import { PersonCard } from "@/components/PersonCard";
import { brainEnabled, brainPicks } from "@/lib/brain";
import { matchesFilters, NO_FILTERS, withFilters, type FeedFilters as Filters } from "@/lib/feed-filters";
import { scorePair, type MeetPreference, type Person, type WorkStatus } from "@/lib/match";
import { isHere } from "@/lib/presence";
import { rerankWithBrain } from "@/lib/rerank";
import { coAttendeesAcrossEvents, featuredFor, getUser, introStatesFor, listAttendees } from "@/lib/queries";

export type Tab = "everyone" | "for-you" | "brain" | "across";

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
// Brain details (Brain / Across events tabs, Brain scores) are for admins only: the Brain still works quietly inside "For you" for everyone.
export function PeopleFeed({ eventId, endsAt, base, meId, tab, admin = false, filters = NO_FILTERS }: { eventId: string; endsAt: Date; base: string; meId: string; tab: Tab; admin?: boolean; filters?: Filters }) {
  // Tab links and "back" links keep the filters in the URL.
  const fbase = withFilters(base, filters);
  const tabs: { id: Tab; label: string }[] = [
    { id: "everyone", label: "Everyone" },
    { id: "for-you", label: "For you" },
    ...(admin && brainEnabled()
      ? [
          { id: "brain" as Tab, label: "Brain" },
          { id: "across" as Tab, label: "Across events" },
        ]
      : []),
  ];
  return (
    <>
      <div className="flex gap-2 rounded-full bg-neutral-100 p-1 dark:bg-neutral-900">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={tabHref(fbase, t.id)}
            className={`flex min-h-10 flex-1 items-center justify-center rounded-full text-sm font-medium ${
              tab === t.id ? "bg-white shadow dark:bg-neutral-800" : "text-neutral-500"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>
      {tab !== "across" && <FeedFilters base={base} tab={tab} filters={filters} />}
      <Suspense fallback={<p className="text-neutral-400">Loading people…</p>}>
        <Feed eventId={eventId} endsAt={endsAt} base={fbase} meId={meId} tab={tab} admin={admin} filters={filters} />
      </Suspense>
    </>
  );
}

async function Feed({ eventId, endsAt, base, meId, tab, admin, filters }: { eventId: string; endsAt: Date; base: string; meId: string; tab: Tab; admin: boolean; filters: Filters }) {
  if (tab === "across" && admin) return <AcrossFeed meId={meId} back={tabHref(base, tab)} />;
  const [me, everyone] = await Promise.all([getUser(meId), listAttendees(eventId, meId)]);
  if (everyone.length === 0) return <p className="text-neutral-500">No one else has checked in yet.</p>;
  const rows = everyone.filter((r) => matchesFilters(r.user, filters));
  if (rows.length === 0) return <p className="text-neutral-500">No one matches these filters. Try clearing them.</p>;
  const ids = rows.map((r) => r.user.id);
  const [states, projectsBy] = await Promise.all([introStatesFor(meId, ids), featuredFor(ids)]);
  const back = tabHref(base, tab);

  // The Brain tab only uses the Brain for the similarity score. The text shown comes from our own profile data:
  // the Brain's page summaries can mention who connected with whom, which must never be shown to other people.
  if (tab === "brain" && me && admin) {
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
    const { list: ranked } = await rerankWithBrain(me, plain, 8, { eventId });
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
            brainMatch={admin ? brain : undefined}
            rankNote={admin ? note : undefined}
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


// People from every event I checked in to, ranked only by the Brain's similarity. This is how the Brain connects people
// beyond one venue or one day. Same privacy circle as an event page: only people who were checked in at an event I was at.
// The text shown comes from our own profile data, never from the Brain's summaries (they can mention who met whom).
export async function AcrossFeed({ meId, back }: { meId: string; back: string }) {
  const [me, rows] = await Promise.all([getUser(meId), coAttendeesAcrossEvents(meId)]);
  if (!me) return null;
  if (rows.length === 0) {
    return <p className="text-neutral-500">No one from your events yet. Check in to an event and they will show up here.</p>;
  }
  const picks = await brainPicks(
    me,
    rows.map((r) => ({ id: r.user.id, name: r.user.name, githubLogin: r.user.githubLogin })),
  );
  if (!picks) return <p className="text-neutral-500">The Brain isn't reachable right now. Try again in a minute.</p>;
  const known = rows
    .filter((r) => picks.has(r.user.id))
    .sort((a, b) => picks.get(b.user.id)!.similarity - picks.get(a.user.id)!.similarity);
  if (known.length === 0) {
    return <p className="text-neutral-500">The Brain hasn't learned about these people yet. New profiles take a minute or two to be understood.</p>;
  }
  const ids = known.map((r) => r.user.id);
  const [states, projectsBy] = await Promise.all([introStatesFor(meId, ids), featuredFor(ids)]);
  return (
    <ul className="flex flex-col gap-3">
      {known.map(({ user, titles }) => (
        <PersonCard
          key={user.id}
          userId={user.id}
          photoAt={user.photoAt}
          name={user.name}
          stack={user.stack}
          topics={user.topics}
          meetPreference={user.meetPreference as MeetPreference}
          hereNow={false}
          project={projectsBy.get(user.id)}
          why={scorePair(toPerson(me), toPerson(user)).why}
          brainMatch={picks.get(user.id)!.similarity}
          note={`Also at ${titles.join(", ")}`}
        >
          <IntroControl toUserId={user.id} back={back} state={states.get(user.id)} />
        </PersonCard>
      ))}
    </ul>
  );
}
