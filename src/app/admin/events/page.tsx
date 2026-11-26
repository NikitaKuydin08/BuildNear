import { Suspense } from "react";
import Link from "next/link";
import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { events } from "@/db/schema";
import { requireAdmin } from "@/lib/organizer";
import { EventTimes } from "@/components/DateTimeField";
import { createEvent } from "./actions";

const input = "min-h-12 w-full rounded-xl border border-neutral-300 bg-transparent px-4 dark:border-neutral-700";
const fmt = (d: Date) => d.toLocaleString("en-GB", { timeZone: "Asia/Bangkok", dateStyle: "medium", timeStyle: "short" });

async function AdminView({ searchParams }: { searchParams: PageProps<"/admin/events">["searchParams"] }) {
  const sp = await searchParams;
  await requireAdmin("/admin/events");

  const list = await getDb().select().from(events).orderBy(desc(events.startsAt));

  return (
    <div className="flex flex-col gap-6">
      <form action={createEvent} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium">Title<input name="title" required maxLength={80} className={input} /></label>
        <label className="flex flex-col gap-1 text-sm font-medium">Venue<input name="venue" required maxLength={120} className={input} /></label>
        <EventTimes />
        <label className="flex flex-col gap-1 text-sm font-medium">Luma link (optional)<input name="lumaUrl" type="url" className={input} /></label>
        {sp.error && <p className="text-sm text-red-600">Check the fields. The end must be after the start.</p>}
        {sp.created && <p className="text-sm text-green-700 dark:text-green-400">Event created.</p>}
        <button className="min-h-12 rounded-full bg-black px-6 font-medium text-white dark:bg-white dark:text-black" type="submit">Create event</button>
      </form>

      <section className="flex flex-col gap-3">
        <h2 className="font-medium">Events</h2>
        <ul className="flex flex-col gap-3">
          {list.map((e) => (
            <li key={e.id} className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
              <p className="font-medium">{e.title}</p>
              <p className="text-xs text-neutral-500">{e.venue} · {fmt(e.startsAt)} to {fmt(e.endsAt)}</p>
              <p className="mt-1 text-xs text-neutral-500">Typed code: <span className="font-mono">{e.checkInCode}</span></p>
              <Link href={`/events/${e.slug}/qr`} className="mt-3 flex min-h-11 items-center justify-center rounded-full bg-black px-4 text-sm font-medium text-white dark:bg-white dark:text-black">
                Show check-in QR
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default function AdminEventsPage(props: PageProps<"/admin/events">) {
  return (
    <main className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">Organizer: events</h1>
      <Suspense fallback={<p className="text-neutral-400">Loading…</p>}>
        <AdminView searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}
