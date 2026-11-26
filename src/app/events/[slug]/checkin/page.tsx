import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { AutoCheckIn } from "@/components/AutoCheckIn";
import { getAttendance, getEventBySlug } from "@/lib/queries";
import { requireUserId } from "@/lib/session";
import { checkIn } from "../../actions";

// Opened by scanning the event QR. After sign-in the form submits itself (a POST from the browser, not a GET),
// so link previews and prefetching can never check anyone in by accident.
async function CheckInView({ params, searchParams }: { params: PageProps<"/events/[slug]/checkin">["params"]; searchParams: PageProps<"/events/[slug]/checkin">["searchParams"] }) {
  const { slug } = await params;
  const sp = await searchParams;
  const code = typeof sp.code === "string" ? sp.code : "";
  const token = typeof sp.t === "string" ? sp.t : "";

  const meId = await requireUserId(`/events/${slug}/checkin?${token ? `t=${encodeURIComponent(token)}` : `code=${encodeURIComponent(code)}`}`);
  const event = await getEventBySlug(slug);
  if (!event) notFound();
  const attendance = await getAttendance(meId, event.id);

  const stillHere = !!attendance?.checkedInAt && !(attendance.leftAt && attendance.leftAt >= attendance.checkedInAt);
  if (stillHere) redirect(`/people?event=${slug}`);

  return <AutoCheckIn action={checkIn} slug={slug} code={code} token={token} title={event.title} />;
}

export default function CheckInPage(props: PageProps<"/events/[slug]/checkin">) {
  return (
    <main className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">Check in</h1>
      <Suspense fallback={<p className="text-neutral-400">Loading…</p>}>
        <CheckInView params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}
