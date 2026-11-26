import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { Eyebrow, IconBubble, Lead, Screen, Title, btnPrimary, btnSecondary } from "@/components/ui";
import { BADGE_FIELDS, BADGE_LEVELS, badgeSrc, levelIndex } from "@/lib/badge-levels";
import { eventCounts, fieldProgress, getAttendance, getEventBySlug } from "@/lib/queries";
import { requireUserId } from "@/lib/session";

// Figma 04 · Checked in. Shown right after a successful check-in.
async function Welcome({ params }: { params: PageProps<"/events/[slug]/welcome">["params"] }) {
  const { slug } = await params;
  const meId = await requireUserId(`/events/${slug}/welcome`);
  const event = await getEventBySlug(slug);
  if (!event) notFound();
  const attendance = await getAttendance(meId, event.id);
  if (!attendance?.checkedInAt) redirect(`/events/${slug}`);

  const [counts, progress] = await Promise.all([eventCounts(event.id), fieldProgress(meId)]);
  const others = Math.max(0, counts.here - 1);

  // The field badge this check-in counts toward (only events with a field have one).
  const field = BADGE_FIELDS.find((f) => f.key === event.field);
  const count = field ? (progress.find((p) => p.field === field.key)?.count ?? 0) : 0;
  const level = field && levelIndex(count) >= 0 ? BADGE_LEVELS[levelIndex(count)] : null;
  const justReached = level && level.at === count;

  return (
    <Screen>
      <Eyebrow className="mt-4">Step 2 of 2 · You’re in</Eyebrow>
      <div className="mt-10 self-center">
        <IconBubble name="check" />
      </div>
      <Title size={30} className="mt-9">
        {others > 0 ? (
          <>
            Someone interesting
            <br />
            is already here.
          </>
        ) : (
          <>
            You’re the first
            <br />
            one here.
          </>
        )}
      </Title>
      <Lead className="mt-4 text-[16px] leading-[24px]">
        You’re visible at {event.title}.
        <br />
        {others > 0 ? "Find a shared interest and say hello." : "People show up here as they check in."}
      </Lead>

      {field && level && (
        <Link href="/badges" className="mt-9 flex items-center gap-4 rounded-[20px] bg-card p-5">
          <Image src={badgeSrc(field.folder, level.file)} alt="" width={64} height={54} unoptimized className="h-auto w-16 shrink-0" />
          <div>
            <p className="text-[18px] font-semibold leading-[24px]">{justReached ? `${level.name} unlocked` : `${field.label} · ${level.name}`}</p>
            <p className="mt-1 text-[12px] text-muted">
              {count === 1 ? "Your first event. Your first chapter." : `${count} ${field.label} events. Your story keeps growing.`}
            </p>
          </div>
        </Link>
      )}

      <div className="mt-9 flex flex-col gap-3">
        <Link href={`/people?event=${slug}`} className={btnPrimary}>
          Meet the builders
        </Link>
        {field && level && (
          <Link href="/badges" className={btnSecondary}>
            {count === 1 ? "View my first badge" : "View my badges"}
          </Link>
        )}
      </div>
      <p className="mt-6 text-center text-[11px] text-muted">Checked in with the event QR · No GPS location collected</p>
    </Screen>
  );
}

export default function WelcomePage(props: PageProps<"/events/[slug]/welcome">) {
  return (
    <>
      <TopBar />
      <Suspense fallback={<p className="p-5 text-muted">Loading…</p>}>
        <Welcome params={props.params} />
      </Suspense>
    </>
  );
}
