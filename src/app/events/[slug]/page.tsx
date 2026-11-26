import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CurrentEvent } from "@/components/CurrentEvent";
import { QrScanner } from "@/components/QrScanner";
import { BackBar, Icon, Poster, Screen, btnPrimary, btnSecondary, eventWhen, inputCls } from "@/components/ui";
import { hasEnded, isHere } from "@/lib/presence";
import { eventCounts, getAttendance, getEventBySlug } from "@/lib/queries";
import { requireUserId } from "@/lib/session";
import { mapEmbedUrl, mapOpenUrl } from "@/lib/venue";
import { checkIn, joinEvent } from "../actions";

type Props = PageProps<"/events/[slug]">;

const ERRORS: Record<string, string> = {
  code: "That QR or code didn't work. Scan the live QR again, or type the code shown at the venue.",
  window: "Check-in is only open during the event.",
};

// Checked in: Figma 14 · Current event. Before that: the concept's "Walk in. Find your people." check-in card
// (joining ahead and the typed-code fallback have no Figma screen; they use the same parts).
async function EventView({ params, searchParams }: { params: Props["params"]; searchParams: Props["searchParams"] }) {
  const { slug } = await params;
  const sp = await searchParams;
  const error = typeof sp.error === "string" ? ERRORS[sp.error] : undefined;

  const meId = await requireUserId(`/events/${slug}`);
  const event = await getEventBySlug(slug);
  if (!event) notFound();
  const [attendance, counts] = await Promise.all([getAttendance(meId, event.id), eventCounts(event.id)]);
  const atVenue = isHere(attendance?.checkedInAt ?? null, attendance?.leftAt ?? null, event.endsAt);
  const over = hasEnded(event.endsAt);

  return (
    <Screen>
      {atVenue ? (
        <CurrentEvent event={event} />
      ) : (
        <>
          <Poster title={event.title} startsAt={event.startsAt} />
          <p className="mt-6 text-[27px] font-semibold leading-[33px] tracking-[-0.4px]">{event.title}</p>
          <p className="mt-2 text-[15px] leading-[22px] text-muted">
            {eventWhen(event.startsAt)} · Bangkok time
            <br />
            {event.venue} · {counts.joined} {counts.joined === 1 ? "builder" : "builders"} joining
          </p>

          {attendance?.checkedInAt && (
            <p className="mt-5 rounded-[14px] bg-lilac p-4 text-[13px] font-medium text-purple">
              {over ? "You were here. Your badge is on the Badges tab." : "You’re marked as left. Scan the QR again to show up as here now."}
            </p>
          )}

          {!attendance && !over && (
            <form action={joinEvent} className="mt-6 flex flex-col gap-3 rounded-[18px] bg-card p-5">
              <input type="hidden" name="slug" value={slug} />
              <p className="text-[15px] font-semibold">Going to this event?</p>
              <p className="text-[13px] leading-[19px] text-muted">Join so others see you are coming. Your contacts stay hidden. You check in at the venue.</p>
              <button className={btnPrimary} type="submit">Join this event</button>
            </form>
          )}
          {attendance && !attendance.checkedInAt && !over && (
            <p className="mt-5 rounded-[14px] bg-lilac p-4 text-[13px] font-medium text-purple">You joined this event. Check in when you arrive at the venue.</p>
          )}

          {!over && (
            <div className="mt-6 flex flex-col gap-3 rounded-[18px] bg-card p-5">
              <div className="flex gap-3">
                <span className="text-purple"><Icon name="shield" /></span>
                <div>
                  <p className="text-[15px] font-semibold">At the venue?</p>
                  <p className="mt-1 text-[13px] leading-[19px] text-muted">Scan the QR code on the screen to check in. You choose when your profile becomes visible.</p>
                </div>
              </div>
              <QrScanner slug={slug} />
              {error && <p className="text-[13px] text-red-600">{error}</p>}
              <details className="text-[13px]">
                <summary className="cursor-pointer text-muted">QR not working?</summary>
                <form action={checkIn} className="mt-3 flex flex-col gap-2">
                  <p className="text-[12px] text-muted">Ask the organiser for the check-in code and type it here.</p>
                  <input type="hidden" name="slug" value={slug} />
                  <input name="code" required autoComplete="off" autoCapitalize="characters" placeholder="Check-in code" className={inputCls} />
                  <button className={btnSecondary} type="submit">Check in with code</button>
                </form>
              </details>
            </div>
          )}
        </>
      )}

      {event.venueLat !== null && event.venueLon !== null && (
        <div className="mt-6 overflow-hidden rounded-[18px] bg-card">
          <iframe title={`Map of ${event.venue}`} src={mapEmbedUrl(event.venueLat, event.venueLon)} loading="lazy" referrerPolicy="no-referrer" className="h-48 w-full border-0" />
          <a href={mapOpenUrl(event.venueLat, event.venueLon)} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-4 py-3 text-[13px] font-semibold text-purple">
            Open the map <Icon name="external" size={14} />
          </a>
        </div>
      )}
    </Screen>
  );
}

export default function EventPage(props: Props) {
  return (
    <>
      <BackBar href="/events" title="Event" />
      <Suspense fallback={<p className="p-5 text-muted">Loading…</p>}>
        <EventView params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}
