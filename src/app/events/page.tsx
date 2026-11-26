import { Suspense } from "react";
import Link from "next/link";
import { InstallHint } from "@/components/InstallHint";
import { TopBar } from "@/components/TopBar";
import { Eyebrow, Icon, SectionLabel, Screen, Title, eventWhen } from "@/components/ui";
import { hasEnded, isHere } from "@/lib/presence";
import { activeEventsFor, listEventsFor } from "@/lib/queries";
import { requireUserId } from "@/lib/session";
import { CurrentEvent } from "@/components/CurrentEvent";

// Events tab. When you are checked in somewhere, Figma 14 · Current event is shown first.
// The list of all events has no Figma screen; it uses the same cards and colours.
async function EventList() {
  const userId = await requireUserId("/events");
  const [rows, past] = await Promise.all([listEventsFor(userId), activeEventsFor(userId)]);
  const current = past.find((r) => isHere(r.checkedInAt, r.leftAt, r.event.endsAt));
  const others = rows.filter((r) => r.event.id !== current?.event.id && !hasEnded(r.event.endsAt, 24 * 3600_000));
  const ended = rows.filter((r) => r.event.id !== current?.event.id && hasEnded(r.event.endsAt, 24 * 3600_000));

  return (
    <>
      {current ? (
        <>
          <Eyebrow className="mt-2">Your current event</Eyebrow>
          <div className="mt-4">
            <CurrentEvent event={current.event} />
          </div>
        </>
      ) : (
        <>
          <Eyebrow className="mt-2">Where builders meet</Eyebrow>
          <Title size={32} className="mt-3">
            Pick a room.
            <br />
            Find your people.
          </Title>
        </>
      )}

      <div className="mt-6">
        <InstallHint />
      </div>

      <SectionLabel className="mt-8">{current ? "Other events" : "Events"}</SectionLabel>
      {others.length === 0 && <p className="mt-3 text-[14px] text-muted">No other events yet. Check back soon.</p>}
      <ul className="mt-3 flex flex-col gap-3">
        {others.map(({ event, checkedInAt, joinedAt }) => (
          <li key={event.id}>
            <Link href={`/events/${event.slug}`} className="flex items-center gap-4 rounded-[18px] bg-card p-4">
              <span className="flex size-14 shrink-0 flex-col items-center justify-center rounded-[14px] bg-yellow text-[#202127]">
                <span className="text-[10px] font-semibold uppercase">{event.startsAt.toLocaleDateString("en-GB", { timeZone: "Asia/Bangkok", month: "short" })}</span>
                <span className="text-[20px] font-semibold leading-[22px]">{event.startsAt.toLocaleDateString("en-GB", { timeZone: "Asia/Bangkok", day: "numeric" })}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[16px] font-semibold">{event.title}</span>
                <span className="block truncate text-[12px] text-muted">{event.venue} · {eventWhen(event.startsAt)}</span>
                <span className="mt-1 block text-[11px] font-medium text-purple">
                  {checkedInAt ? "You were here" : joinedAt ? "Joined · check in at the venue" : "Open to join"}
                </span>
              </span>
              <span className="text-muted"><Icon name="arrow" size={20} /></span>
            </Link>
          </li>
        ))}
      </ul>

      {ended.length > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer text-[12px] font-semibold uppercase tracking-[1.1px] text-muted">Past events ({ended.length})</summary>
          <ul className="mt-3 flex flex-col gap-2">
            {ended.map(({ event, checkedInAt }) => (
              <li key={event.id}>
                <Link href={`/events/${event.slug}`} className="flex items-center justify-between rounded-[14px] bg-card px-4 py-3 text-[14px]">
                  <span className="truncate">{event.title}</span>
                  <span className="text-[11px] text-muted">{checkedInAt ? "Attended" : ""}</span>
                </Link>
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}

export default function EventsPage() {
  return (
    <>
      <TopBar />
      <Screen>
        <Suspense fallback={<p className="text-muted">Loading…</p>}>
          <EventList />
        </Suspense>
      </Screen>
    </>
  );
}
