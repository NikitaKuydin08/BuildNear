import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAttendance, getEventBySlug } from "@/lib/queries";
import { requireUserId } from "@/lib/session";
import { checkIn } from "../../actions";

// Opened by scanning the event QR. A button (not an automatic GET) does the check-in,
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

  if (attendance?.checkedInAt) {
    return (
      <>
        <p className="rounded-2xl bg-green-100 p-3 text-sm font-medium text-green-800 dark:bg-green-900/40 dark:text-green-300">
          You're already checked in.
        </p>
        <Link href={`/events/${slug}`} className="flex min-h-12 items-center justify-center rounded-full bg-black px-6 font-medium text-white dark:bg-white dark:text-black">
          Open the event
        </Link>
      </>
    );
  }

  return (
    <form action={checkIn} className="flex flex-col gap-3">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="code" value={code} />
      <input type="hidden" name="token" value={token} />
      <p className="text-sm text-neutral-500">Confirm that you are at the venue right now.</p>
      <button className="min-h-12 rounded-full bg-black px-6 font-medium text-white dark:bg-white dark:text-black" type="submit">
        Check in to {event.title}
      </button>
    </form>
  );
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
