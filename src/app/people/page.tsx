import { Suspense } from "react";
import Link from "next/link";
import { AcrossFeed, PeopleFeed, type Tab } from "@/components/PeopleFeed";
import { parseIndex } from "@/components/PersonDeck";
import { TopBar } from "@/components/TopBar";
import { EventPill, Eyebrow, Icon, Lead, Screen, Title, btnPrimary, btnSecondary } from "@/components/ui";
import { brainEnabled } from "@/lib/brain";
import { filterQuery, parseFilters } from "@/lib/feed-filters";
import { isHere } from "@/lib/presence";
import { isAdminUser } from "@/lib/organizer";
import { activeEventsFor, eventCounts, purgeExpiredLocations } from "@/lib/queries";
import { requireUserId } from "@/lib/session";

// Figma 05/06 · People at the event: the event I am checked in to, then one builder at a time.
async function HomeView({ searchParams }: { searchParams: PageProps<"/people">["searchParams"] }) {
  const sp = await searchParams;
  const meId = await requireUserId("/people");
  const admin = await isAdminUser(meId);
  await purgeExpiredLocations();
  const tab: Tab =
    sp.tab === "everyone" ? "everyone" : admin && sp.tab === "brain" && brainEnabled() ? "brain" : admin && sp.tab === "across" && brainEnabled() ? "across" : "for-you";
  const index = parseIndex(sp.i);

  const past = await activeEventsFor(meId);
  const active = past.filter((r) => isHere(r.checkedInAt, r.leftAt, r.event.endsAt));
  if (active.length === 0) {
    return (
      <>
        <Eyebrow className="mt-2">Not checked in yet</Eyebrow>
        <Title size={32} className="mt-3">
          Walk in.
          <br />
          Find your people.
        </Title>
        <Lead className="mt-3">Scan the QR code at the venue with your phone camera. After you check in, everyone at the event shows up here.</Lead>
        <div className="mt-8 flex flex-col gap-3">
          <Link href="/events" className={btnPrimary}>See events</Link>
          <Link href="/nearby" className={btnSecondary}>At a café or co-working? Find builders nearby</Link>
        </div>
        {admin && past.length > 0 && brainEnabled() && (
          <section className="mt-10">
            <p className="text-[19px] font-semibold">From your past events</p>
            <p className="mt-1 text-[13px] text-muted">Admin view: people from events you checked in to, matched by the Brain.</p>
            <div className="mt-4">
              <Suspense fallback={<p className="text-muted">Loading people…</p>}>
                <AcrossFeed meId={meId} base="/people" index={index} />
              </Suspense>
            </div>
          </section>
        )}
      </>
    );
  }

  const current = active.find((r) => r.event.slug === sp.event) ?? active[0];
  const { event } = current;
  const base = `/people?event=${event.slug}`;
  const filters = parseFilters(sp);
  const counts = await eventCounts(event.id);
  const fq = filterQuery(filters);
  const filterHref = `/people/filters?event=${event.slug}${tab !== "for-you" ? `&tab=${tab}` : ""}${fq ? `&${fq}` : ""}`;

  return (
    <>
      <EventPill href={`/events/${event.slug}`} title={event.title} sub={`Checked in · ${counts.here} ${counts.here === 1 ? "builder" : "builders"} here`} />
      {active.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {active.map((r) => (
            <Link
              key={r.event.id}
              href={`/people?event=${r.event.slug}`}
              className={`shrink-0 rounded-[10px] px-3 py-2 text-[12px] font-medium ${r.event.id === event.id ? "bg-purple text-white" : "border border-line bg-card text-muted"}`}
            >
              {r.event.title}
            </Link>
          ))}
        </div>
      )}
      <div className="mt-6 flex items-center justify-between">
        <Title size={27}>People here</Title>
        <Link href={filterHref} aria-label="Filter people" className="flex size-11 items-center justify-center rounded-[12px] text-ink hover:bg-purple/5">
          <Icon name="filter" />
        </Link>
      </div>
      <p className="mt-1.5 text-[13px] text-muted">A shared room. A good place to start.</p>
      <PeopleFeed eventId={event.id} endsAt={event.endsAt} base={base} meId={meId} tab={tab} admin={admin} filters={filters} index={index} />
    </>
  );
}

export default function PeopleHome(props: PageProps<"/people">) {
  return (
    <>
      <TopBar />
      <Screen>
        <Suspense fallback={<p className="text-muted">Loading…</p>}>
          <HomeView searchParams={props.searchParams} />
        </Suspense>
      </Screen>
    </>
  );
}
