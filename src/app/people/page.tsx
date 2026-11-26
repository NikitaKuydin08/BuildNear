import { Suspense } from "react";
import Link from "next/link";
import { PeopleFeed, type Tab } from "@/components/PeopleFeed";
import { brainEnabled } from "@/lib/brain";
import { isHere } from "@/lib/presence";
import { activeEventsFor } from "@/lib/queries";
import { requireUserId } from "@/lib/session";

// Home: the people at the event I am checked in to. Events are the second tab.
async function HomeView({ searchParams }: { searchParams: PageProps<"/people">["searchParams"] }) {
  const sp = await searchParams;
  const meId = await requireUserId("/people");
  const tab: Tab = sp.tab === "for-you" ? "for-you" : sp.tab === "brain" && brainEnabled() ? "brain" : "everyone";

  const active = (await activeEventsFor(meId)).filter((r) => isHere(r.checkedInAt, r.leftAt, r.event.endsAt));
  if (active.length === 0) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 p-5 dark:border-neutral-800">
        <p className="font-medium">You are not checked in anywhere yet.</p>
        <p className="text-sm text-neutral-500">
          Scan the QR code at the venue with your phone camera. After you check in, everyone at the event shows up here.
        </p>
        <Link href="/events" className="flex min-h-12 items-center justify-center rounded-full bg-accent px-6 font-medium text-black">
          See events
        </Link>
      </div>
    );
  }

  const current = active.find((r) => r.event.slug === sp.event) ?? active[0];
  const { event } = current;
  const base = `/people?event=${event.slug}`;

  return (
    <>
      <div>
        <p className="text-xs uppercase tracking-wide text-neutral-500">You are at</p>
        <h2 className="text-lg font-semibold">{event.title}</h2>
        <p className="text-sm text-neutral-500">
          {event.venue} · <Link href={`/events/${event.slug}`} className="underline">Event details</Link>
        </p>
      </div>
      {active.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {active.map((r) => (
            <Link
              key={r.event.id}
              href={`/people?event=${r.event.slug}`}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${r.event.id === event.id ? "bg-accent font-medium text-black" : "border border-neutral-300 dark:border-neutral-700"}`}
            >
              {r.event.title}
            </Link>
          ))}
        </div>
      )}
      <PeopleFeed eventId={event.id} endsAt={event.endsAt} base={base} meId={meId} tab={tab} />
    </>
  );
}

export default function PeopleHome(props: PageProps<"/people">) {
  return (
    <main className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">People</h1>
      <Suspense fallback={<p className="text-neutral-400">Loading…</p>}>
        <HomeView searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}
