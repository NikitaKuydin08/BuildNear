import Link from "next/link";
import { Icon, Poster, btnPrimary, btnSecondary, eventWhen } from "@/components/ui";
import { eventCounts } from "@/lib/queries";

type Ev = { id: string; slug: string; title: string; venue: string; startsAt: Date };

// Figma 14 · Current event: poster, details, "You're visible" card, visibility + meet buttons.
export async function CurrentEvent({ event }: { event: Ev }) {
  const counts = await eventCounts(event.id);
  return (
    <div className="flex flex-col">
      <Poster title={event.title} startsAt={event.startsAt} compact />
      <p className="mt-6 text-[27px] font-semibold leading-[33px] tracking-[-0.4px]">{event.title}</p>
      <p className="mt-2 text-[15px] leading-[22px] text-muted">
        {eventWhen(event.startsAt)} · Bangkok time
        <br />
        {event.venue} · {counts.here} {counts.here === 1 ? "builder" : "builders"} here
      </p>
      <div className="mt-6 flex gap-3 rounded-[18px] bg-card p-5">
        <span className="text-purple"><Icon name="shield" /></span>
        <div>
          <p className="text-[14px] font-semibold">You’re visible at this event</p>
          <p className="mt-1.5 text-[13px] leading-[19px] text-muted">
            Only your profile and attendance
            <br />
            are shared. No GPS tracking.
          </p>
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-4">
        <Link href={`/events/${event.slug}/visibility`} className={btnSecondary}>Manage my visibility</Link>
        <Link href={`/people?event=${event.slug}`} className={btnPrimary}>Meet the builders</Link>
      </div>
    </div>
  );
}
