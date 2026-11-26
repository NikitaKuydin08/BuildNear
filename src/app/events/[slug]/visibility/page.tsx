import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackBar, Eyebrow, Icon, Lead, Screen, Title, btnPrimary, btnSecondary } from "@/components/ui";
import { hasEnded, isHere } from "@/lib/presence";
import { getAttendance, getEventBySlug } from "@/lib/queries";
import { requireUserId } from "@/lib/session";
import { leaveEvent } from "../../actions";

type Props = PageProps<"/events/[slug]/visibility">;

// Figma 15 · Visibility settings and 16 · Hidden. The action underneath is the existing "I left":
// you stop showing as "here now" (you can still be found as someone who joined the event), your check-in proof and badge stay.
async function Visibility({ params }: { params: Props["params"] }) {
  const { slug } = await params;
  const meId = await requireUserId(`/events/${slug}/visibility`);
  const event = await getEventBySlug(slug);
  if (!event) notFound();
  const att = await getAttendance(meId, event.id);
  const here = isHere(att?.checkedInAt ?? null, att?.leftAt ?? null, event.endsAt);

  if (!here) {
    return (
      <Screen>
        <span className="mt-10 text-purple"><Icon name="shield" size={40} /></span>
        <Title size={32} className="mt-12">You’re marked as left.</Title>
        <Lead className="mt-5 text-[16px] leading-[24px]">
          People at {event.title} no longer see you as here now. Existing conversations and your badge are still available.
        </Lead>
        <div className="mt-40 flex flex-col gap-3">
          {!hasEnded(event.endsAt) && (
            <Link href={`/events/${slug}`} className={btnPrimary}>Check in again</Link>
          )}
          <Link href="/inbox" className={btnSecondary}>Go to my chats</Link>
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <Eyebrow className="mt-4">Your choice, always</Eyebrow>
      <Title size={30} className="mt-3">
        Be here on
        <br />
        your own terms.
      </Title>
      <Lead className="mt-5">
        Your profile is visible to participants
        <br />
        at {event.title} after you check in.
      </Lead>
      <div className="mt-10 flex gap-4 rounded-[18px] bg-lilac p-5">
        <span className="text-purple"><Icon name="shield" /></span>
        <div>
          <p className="text-[17px] font-semibold">No live location</p>
          <p className="mt-2 text-[14px] leading-[20px] text-muted">
            We use your event check-in,
            <br />
            not your GPS coordinates.
          </p>
        </div>
      </div>
      <form action={leaveEvent} className="mt-40 flex flex-col gap-3">
        <input type="hidden" name="slug" value={slug} />
        <button type="submit" className={btnSecondary}>I left · stop showing me as here now</button>
        <Link href={`/events/${slug}`} className={btnPrimary}>Keep me visible</Link>
      </form>
    </Screen>
  );
}

export default function VisibilityPage(props: Props) {
  return (
    <>
      <Suspense fallback={null}>
        <Back params={props.params} />
      </Suspense>
      <Suspense fallback={<p className="p-5 text-muted">Loading…</p>}>
        <Visibility params={props.params} />
      </Suspense>
    </>
  );
}

async function Back({ params }: { params: Props["params"] }) {
  const { slug } = await params;
  return <BackBar href={`/events/${slug}`} title="Your visibility" />;
}
