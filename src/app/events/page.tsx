import { Suspense } from "react";
import Link from "next/link";
import { InstallHint } from "@/components/InstallHint";
import { listEventsFor } from "@/lib/queries";
import { requireUserId } from "@/lib/session";

const fmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Bangkok",
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

async function EventList() {
  const userId = await requireUserId();
  const rows = await listEventsFor(userId);

  if (rows.length === 0) {
    return <p className="text-neutral-500">No events yet. Check back soon.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {rows.map(({ event, checkedInAt, joinedAt }) => (
        <li key={event.id}>
          <Link
            href={`/events/${event.slug}`}
            className="block rounded-2xl border border-neutral-200 p-4 active:bg-neutral-50 dark:border-neutral-800 dark:active:bg-neutral-900"
          >
            <p className="font-medium">{event.title}</p>
            <p className="text-sm text-neutral-500">{event.venue}</p>
            <p className="mt-1 text-xs text-neutral-500">{fmt.format(event.startsAt)} (Bangkok time)</p>
            <p className="mt-2 text-xs font-medium">
              {checkedInAt ? "You're here" : joinedAt ? "Joined · check in at the venue" : "Open to join"}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function EventsPage() {
  return (
    <main className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">Events</h1>
      <InstallHint />
      <Suspense fallback={<p className="text-neutral-400">Loading…</p>}>
        <EventList />
      </Suspense>
    </main>
  );
}
