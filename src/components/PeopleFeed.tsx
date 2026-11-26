import { Suspense } from "react";
import Link from "next/link";
import { DeckEmpty, PersonDeck, withIndex, type DeckItem } from "@/components/PersonDeck";
import type { PersonCardProps } from "@/components/PersonCard";
import { brainEnabled, brainPicks } from "@/lib/brain";
import { FIELDS } from "@/lib/fields";
import { hasFilters, matchesFilters, NO_FILTERS, withFilters, type FeedFilters as Filters } from "@/lib/feed-filters";
import { scorePair, type MeetPreference, type Person, type WorkStatus } from "@/lib/match";
import { isHere } from "@/lib/presence";
import { rerankWithBrain } from "@/lib/rerank";
import { coAttendeesAcrossEvents, featuredFor, getUser, introStatesFor, listAttendees, type FeaturedProject } from "@/lib/queries";

export type Tab = "everyone" | "for-you" | "brain" | "across";

// `base` is the page this feed lives on, e.g. "/people?event=<slug>".
// "For you" is the default tab (first in the concept design), so it needs no parameter.
export function tabHref(base: string, tab: Tab) {
  if (tab === "for-you") return base;
  return `${base}${base.includes("?") ? "&" : "?"}tab=${tab}`;
}

function toPerson(u: { stack: string[]; topics: string[]; tags: string[]; meetPreference: string; workStatus: string | null }): Person {
  return {
    stack: u.stack,
    topics: u.topics,
    tags: u.tags,
    meetPreference: u.meetPreference as MeetPreference,
    workStatus: u.workStatus as WorkStatus,
  };
}

type UserRow = {
  id: string;
  name: string;
  photoAt: Date | null;
  stack: string[];
  topics: string[];
  tags: string[];
  meetPreference: string;
  workStatus: string | null;
};

export function cardOf(u: UserRow, extra: Partial<PersonCardProps> & { project?: FeaturedProject | null }): PersonCardProps {
  return {
    userId: u.id,
    photoAt: u.photoAt,
    name: u.name,
    stack: u.stack,
    topics: u.topics,
    tags: u.tags,
    meetPreference: u.meetPreference as MeetPreference,
    workStatus: u.workStatus,
    hereNow: false,
    ...extra,
  };
}

const MEET_LABEL: Record<string, string> = { in_person: "Meets in person", open: "Open to meeting", chat_first: "Chat first" };

// For you / Everyone (concept tabs) for one event, then the one-at-a-time deck.
// Brain details (Brain / Across events tabs, Brain scores) are for admins only: the Brain still works quietly inside "For you" for everyone.
export function PeopleFeed({ eventId, endsAt, base, meId, tab, admin = false, filters = NO_FILTERS, index = 0 }: { eventId: string; endsAt: Date; base: string; meId: string; tab: Tab; admin?: boolean; filters?: Filters; index?: number }) {
  const fbase = withFilters(base, filters);
  const tabs: { id: Tab; label: string }[] = [
    { id: "for-you", label: "For you" },
    { id: "everyone", label: "Everyone" },
    ...(admin && brainEnabled()
      ? [
          { id: "brain" as Tab, label: "Brain" },
          { id: "across" as Tab, label: "Across" },
        ]
      : []),
  ];
  const [path, qs] = base.split("?");
  const keep = new URLSearchParams(qs ?? "");
  if (tab !== "for-you") keep.set("tab", tab);
  const clear = `${path}?${keep.toString()}`;
  const active = [
    filters.stack,
    filters.meet ? MEET_LABEL[filters.meet] : "",
    filters.field ? (FIELDS.find((f) => f.key === filters.field)?.label ?? filters.field) : "",
  ].filter(Boolean);

  return (
    <>
      <div className="mt-5 flex gap-1 rounded-[12px] bg-line/70 p-1">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={tabHref(fbase, t.id)}
            className={`flex min-h-9 flex-1 items-center justify-center rounded-[9px] text-[12px] font-medium ${tab === t.id ? "bg-card text-ink shadow-sm" : "text-muted"}`}
          >
            {t.label}
          </Link>
        ))}
      </div>
      {tab !== "across" && hasFilters(filters) && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px]">
          <span className="text-muted">Showing:</span>
          {active.map((a) => (
            <span key={a} className="rounded-[8px] bg-lilac px-2.5 py-1 font-medium text-purple">{a}</span>
          ))}
          <Link href={clear} className="font-medium text-purple underline underline-offset-2">Show all</Link>
        </div>
      )}
      <div className="mt-5">
        <Suspense fallback={<p className="text-muted">Loading people…</p>}>
          <Feed eventId={eventId} endsAt={endsAt} base={tabHref(fbase, tab)} meId={meId} tab={tab} admin={admin} filters={filters} index={index} />
        </Suspense>
      </div>
    </>
  );
}

async function Feed({ eventId, endsAt, base, meId, tab, admin, filters, index }: { eventId: string; endsAt: Date; base: string; meId: string; tab: Tab; admin: boolean; filters: Filters; index: number }) {
  if (tab === "across" && admin) return <AcrossFeed meId={meId} base={base} index={index} />;
  const [me, everyone] = await Promise.all([getUser(meId), listAttendees(eventId, meId)]);
  if (everyone.length === 0) {
    return <DeckEmpty title="You’re early." body="No one else has joined yet. People appear here as they check in." />;
  }
  const rows = everyone.filter((r) => matchesFilters(r.user, filters));
  if (rows.length === 0) {
    return <DeckEmpty title="No one with that, yet." body="Nobody here matches these filters. Try another stack or show everyone." />;
  }
  const ids = rows.map((r) => r.user.id);
  const [states, projectsBy] = await Promise.all([introStatesFor(meId, ids), featuredFor(ids)]);

  let items: DeckItem[];

  if (tab === "brain" && me && admin) {
    // The Brain tab only uses the Brain for the similarity score. The text shown comes from our own profile data:
    // the Brain's page summaries can mention who connected with whom, which must never be shown to other people.
    const picks = await brainPicks(me, rows.map((r) => ({ id: r.user.id, name: r.user.name, githubLogin: r.user.githubLogin })));
    if (!picks) return <DeckEmpty title="The Brain isn’t reachable." body="The “For you” tab still works." />;
    const known = rows.filter((r) => picks.has(r.user.id)).sort((a, b) => picks.get(b.user.id)!.similarity - picks.get(a.user.id)!.similarity);
    if (known.length === 0) return <DeckEmpty title="Still learning." body="The Brain hasn’t learned about the people here yet. New profiles take a minute or two." />;
    items = known.map(({ user, checkedInAt, leftAt }) => ({
      card: cardOf(user, {
        hereNow: isHere(checkedInAt, leftAt, endsAt),
        project: projectsBy.get(user.id),
        why: scorePair(toPerson(me), toPerson(user)).why,
        brainMatch: picks.get(user.id)!.similarity,
      }),
      state: states.get(user.id),
    }));
  } else if (tab === "for-you" && me) {
    const mine = toPerson(me);
    const plain = rows.map((r) => ({ ...r, match: scorePair(mine, toPerson(r.user)) })).sort((a, b) => b.match.score - a.match.score);
    // The Brain re-ranks the top few; if it is off or slow, the plain ranking is used as is.
    // Logged for the evaluation panel only on the first card, so stepping through the deck doesn't add duplicate rows.
    const { list: ranked } = await rerankWithBrain(me, plain, 8, index === 0 ? { eventId } : undefined);
    items = ranked.map(({ user, checkedInAt, leftAt, match, brain, note }) => ({
      card: cardOf(user, {
        hereNow: isHere(checkedInAt, leftAt, endsAt),
        project: projectsBy.get(user.id),
        why: match.why,
        action: match.action,
        brainMatch: admin ? brain : undefined,
        rankNote: admin ? note : undefined,
      }),
      state: states.get(user.id),
    }));
  } else {
    items = rows.map(({ user, checkedInAt, leftAt }) => ({
      card: cardOf(user, {
        hereNow: isHere(checkedInAt, leftAt, endsAt),
        project: projectsBy.get(user.id),
        why: me ? scorePair(toPerson(me), toPerson(user)).why : undefined,
      }),
      state: states.get(user.id),
    }));
  }

  return <PersonDeck items={items} index={index} base={withIndex(base, 0)} />;
}

// People from every event I checked in to, ranked only by the Brain's similarity (admin only).
// Same privacy circle as an event page: only people who were checked in at an event I was at.
// The text shown comes from our own profile data, never from the Brain's summaries (they can mention who met whom).
export async function AcrossFeed({ meId, base, index = 0 }: { meId: string; base: string; index?: number }) {
  const [me, rows] = await Promise.all([getUser(meId), coAttendeesAcrossEvents(meId)]);
  if (!me) return null;
  if (rows.length === 0) return <DeckEmpty title="No one yet." body="Check in to an event and the people from it show up here." />;
  const picks = await brainPicks(me, rows.map((r) => ({ id: r.user.id, name: r.user.name, githubLogin: r.user.githubLogin })));
  if (!picks) return <DeckEmpty title="The Brain isn’t reachable." body="Try again in a minute." />;
  const known = rows.filter((r) => picks.has(r.user.id)).sort((a, b) => picks.get(b.user.id)!.similarity - picks.get(a.user.id)!.similarity);
  if (known.length === 0) return <DeckEmpty title="Still learning." body="The Brain hasn’t learned about these people yet." />;
  const ids = known.map((r) => r.user.id);
  const [states, projectsBy] = await Promise.all([introStatesFor(meId, ids), featuredFor(ids)]);
  const items: DeckItem[] = known.map(({ user, titles }) => ({
    card: cardOf(user, {
      project: projectsBy.get(user.id),
      why: scorePair(toPerson(me), toPerson(user)).why,
      brainMatch: picks.get(user.id)!.similarity,
      note: `Also at ${titles.join(", ")}`,
    }),
    state: states.get(user.id),
  }));
  return <PersonDeck items={items} index={index} base={withIndex(base, 0)} />;
}
