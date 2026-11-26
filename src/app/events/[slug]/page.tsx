import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IntroControl } from "@/components/IntroControl";
import { PersonCard } from "@/components/PersonCard";
import { scorePair, type MeetPreference, type Person, type WorkStatus } from "@/lib/match";
import { badgeConfigured, txUrl } from "@/lib/chain";
import { brainEnabled, brainPicks } from "@/lib/brain";
import { featuredFor, getAttendance, getBadge, getEventBySlug, getUser, introStatesFor, listAttendees } from "@/lib/queries";
import { isHere } from "@/lib/presence";
import { requireUserId } from "@/lib/session";
import { QrScanner } from "@/components/QrScanner";
import { checkIn, claimBadge, joinEvent, leaveEvent } from "../actions";

type Props = PageProps<"/events/[slug]">;
type Tab = "everyone" | "for-you" | "brain";

const ERRORS: Record<string, string> = {
  code: "That code doesn't match. Check the code shown at the venue.",
  window: "Check-in is only open during the event.",
  wallet: "That doesn't look like a wallet address (0x… with 42 characters).",
  minter: "That is the app's own wallet. Paste your personal wallet address from MetaMask.",
  notchecked: "Check in at the venue first, then claim your badge.",
  mint: "The badge couldn't be minted right now. Try again in a minute.",
};

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

async function EventView({ params, searchParams }: { params: Props["params"]; searchParams: Props["searchParams"] }) {
  const { slug } = await params;
  const sp = await searchParams;
  const tab: Tab = sp.tab === "for-you" ? "for-you" : sp.tab === "brain" && brainEnabled() ? "brain" : "everyone";
  const error = typeof sp.error === "string" ? ERRORS[sp.error] : undefined;

  const meId = await requireUserId();
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const attendance = await getAttendance(meId, event.id);
  // Checked in and not marked as left since.
  const atVenue = !!attendance?.checkedInAt && !(attendance.leftAt && attendance.leftAt >= attendance.checkedInAt);
  const [badge, me] = await Promise.all([getBadge(meId, event.id), getUser(meId)]);

  return (
    <main className="flex flex-col gap-4 p-4">
      <div>
        <Link href="/events" className="text-sm text-neutral-500">
          ← Events
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">{event.title}</h1>
        <p className="text-sm text-neutral-500">{event.venue}</p>
      </div>

      {!attendance && (
        <form action={joinEvent}>
          <input type="hidden" name="slug" value={slug} />
          <button className="min-h-12 w-full rounded-full bg-black px-6 font-medium text-white dark:bg-white dark:text-black" type="submit">
            Join this event
          </button>
        </form>
      )}

      {attendance && !atVenue && (
        <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
          <p className="text-sm font-medium">At the venue? Scan the QR code the organisers are showing.</p>
          <QrScanner slug={slug} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <details className="text-sm">
            <summary className="cursor-pointer text-neutral-500">QR not working?</summary>
            <form action={checkIn} className="mt-3 flex flex-col gap-2">
              <p className="text-xs text-neutral-500">Ask the organiser for the check-in code and type it here.</p>
              <input type="hidden" name="slug" value={slug} />
              <input
                name="code"
                required
                autoComplete="off"
                autoCapitalize="characters"
                placeholder="Check-in code"
                className="min-h-12 rounded-xl border border-neutral-300 bg-transparent px-4 dark:border-neutral-700"
              />
              <button className="min-h-12 rounded-full border border-neutral-300 px-6 font-medium dark:border-neutral-700" type="submit">
                Check in with code
              </button>
            </form>
          </details>
        </div>
      )}

      {atVenue && (
        <form action={leaveEvent} className="flex items-center justify-between gap-3 rounded-2xl bg-green-100 p-3 dark:bg-green-900/40">
          <input type="hidden" name="slug" value={slug} />
          <p className="text-sm font-medium text-green-800 dark:text-green-300">You're checked in. Others can see you're here.</p>
          <button className="min-h-11 shrink-0 rounded-full border border-green-800/30 px-4 text-sm font-medium text-green-800 dark:text-green-300" type="submit">
            I left
          </button>
        </form>
      )}

      {attendance?.checkedInAt && badgeConfigured() && (
        <div className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
          {badge ? (
            <>
              <p className="text-sm font-medium">Badge claimed.</p>
              <a href={txUrl(badge.txHash)} target="_blank" rel="noreferrer" className="text-sm underline">
                View on BscScan
              </a>
            </>
          ) : (
            <form action={claimBadge} className="flex flex-col gap-2">
              <p className="text-sm font-medium">Claim your attendance badge</p>
              <p className="text-xs text-neutral-500">
                A free, non-transferable badge on BNB testnet. We pay the gas. It only proves you were here.
              </p>
              <input type="hidden" name="slug" value={slug} />
              <input
                name="wallet"
                required
                defaultValue={me?.walletAddress ?? ""}
                autoComplete="off"
                autoCapitalize="none"
                placeholder="Your wallet address (0x…)"
                className="min-h-12 rounded-xl border border-neutral-300 bg-transparent px-4 text-sm dark:border-neutral-700"
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button className="min-h-12 rounded-full bg-black px-6 font-medium text-white dark:bg-white dark:text-black" type="submit">
                Claim badge
              </button>
            </form>
          )}
        </div>
      )}

      {attendance && (
        <>
          <div className="flex gap-2 rounded-full bg-neutral-100 p-1 dark:bg-neutral-900">
            {[
              { id: "everyone", label: "Everyone", href: `/events/${slug}` },
              { id: "for-you", label: "For you", href: `/events/${slug}?tab=for-you` },
              ...(brainEnabled() ? [{ id: "brain", label: "Brain", href: `/events/${slug}?tab=brain` }] : []),
            ].map((t) => (
              <Link
                key={t.id}
                href={t.href}
                className={`flex min-h-10 flex-1 items-center justify-center rounded-full text-sm font-medium ${
                  tab === t.id ? "bg-white shadow dark:bg-neutral-800" : "text-neutral-500"
                }`}
              >
                {t.label}
              </Link>
            ))}
          </div>

          <Suspense fallback={<p className="text-neutral-400">Loading people…</p>}>
            <Feed eventId={event.id} endsAt={event.endsAt} slug={slug} meId={meId} tab={tab} />
          </Suspense>
        </>
      )}
    </main>
  );
}

async function Feed({ eventId, endsAt, slug, meId, tab }: { eventId: string; endsAt: Date; slug: string; meId: string; tab: Tab }) {
  const [me, rows] = await Promise.all([getUser(meId), listAttendees(eventId, meId)]);
  if (rows.length === 0) return <p className="text-neutral-500">No one else has joined yet.</p>;
  const ids = rows.map((r) => r.user.id);
  const [states, projectsBy] = await Promise.all([introStatesFor(meId, ids), featuredFor(ids)]);
  const back = `/events/${slug}${tab === "everyone" ? "" : `?tab=${tab}`}`;

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
            why={picks.get(user.id)!.why}
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
    const ranked = rows
      .map((r) => ({ ...r, match: scorePair(mine, toPerson(r.user)) }))
      .sort((a, b) => b.match.score - a.match.score);
    return (
      <ul className="flex flex-col gap-3">
        {ranked.map(({ user, checkedInAt, leftAt, match }) => (
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

export default function EventPage(props: Props) {
  return (
    <Suspense fallback={<p className="p-4 text-neutral-400">Loading…</p>}>
      <EventView params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}
