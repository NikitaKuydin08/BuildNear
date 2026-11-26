import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { ConsentJoin } from "@/components/ConsentJoin";
import { BackBar, Chips, Eyebrow, FootNote, SectionLabel, Screen, Title, firstName, inputCls } from "@/components/ui";
import { makeToken, verifyToken } from "@/lib/qr-token";
import { getAttendance, getEventBySlug, getUser } from "@/lib/queries";
import { requireUserId } from "@/lib/session";
import { checkIn } from "../../actions";

// Figma 02/03 · Review profile + visibility consent. Opened by scanning the event QR (after GitHub sign-in).
// Nothing happens on page load: the check-in is a POST sent only when the person ticks the box and taps "Join the event",
// so link previews and prefetching can never check anyone in.
async function Review({ params, searchParams }: { params: PageProps<"/events/[slug]/checkin">["params"]; searchParams: PageProps<"/events/[slug]/checkin">["searchParams"] }) {
  const { slug } = await params;
  const sp = await searchParams;
  const code = typeof sp.code === "string" ? sp.code : "";
  const given = typeof sp.t === "string" ? sp.t : "";

  const meId = await requireUserId(`/events/${slug}/checkin?${given ? `t=${encodeURIComponent(given)}` : `code=${encodeURIComponent(code)}`}`);
  const event = await getEventBySlug(slug);
  if (!event) notFound();
  const [attendance, me] = await Promise.all([getAttendance(meId, event.id), getUser(meId)]);
  if (!me) notFound();

  const stillHere = !!attendance?.checkedInAt && !(attendance.leftAt && attendance.leftAt >= attendance.checkedInAt);
  if (stillHere) redirect(`/people?event=${slug}`);

  // The QR token is short-lived. If it was valid when this screen opened, hand the form a fresh one,
  // so reading the profile and ticking the box never makes the scan expire.
  const token = given && verifyToken(event.id, given) ? makeToken(event.id) : given;

  return (
    <Screen>
      <Eyebrow className="mt-2">Step 1 of 2 · Make it yours</Eyebrow>
      <Title className="mt-3">
        Nice to meet
        <br />
        you, {firstName(me.name)}.
      </Title>

      <div className="mt-6 flex items-center gap-4 rounded-[18px] bg-card p-4">
        <Avatar userId={me.id} name={me.name} photoAt={me.photoAt} size={56} />
        <div className="min-w-0">
          <p className="truncate text-[18px] font-semibold leading-[24px]">{me.name}</p>
          <p className="truncate text-[12px] text-muted">@{me.githubLogin} · From GitHub</p>
        </div>
      </div>

      <form action={checkIn} className="flex flex-col">
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="code" value={code} />
        <input type="hidden" name="token" value={token} />

        <SectionLabel className="mt-7">Builds with</SectionLabel>
        <div className="mt-3">
          {me.stack.length > 0 ? <Chips items={me.stack} max={8} /> : <p className="text-[12px] text-muted">No stack found on GitHub yet. You can add it in your profile.</p>}
        </div>

        <SectionLabel className="mt-7">I want to explore</SectionLabel>
        <input name="explore" defaultValue={me.tags.join(", ")} maxLength={300} placeholder="Creative tools, product design" className={`${inputCls} mt-3 min-h-[70px]`} />
        <p className="mt-3 text-[12px] text-muted">Your interests are yours to choose.</p>

        <ConsentJoin eventTitle={event.title} />
      </form>
      <FootNote>Checking in proves you are at the venue. Your contacts stay hidden until you accept an introduction.</FootNote>
    </Screen>
  );
}

export default function CheckInPage(props: PageProps<"/events/[slug]/checkin">) {
  return (
    <>
      <Suspense fallback={null}>
        <BackFor params={props.params} />
      </Suspense>
      <Suspense fallback={<p className="p-5 text-muted">Loading…</p>}>
        <Review params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function BackFor({ params }: { params: PageProps<"/events/[slug]/checkin">["params"] }) {
  const { slug } = await params;
  return <BackBar href={`/events/${slug}`} title="Your builder profile" />;
}
