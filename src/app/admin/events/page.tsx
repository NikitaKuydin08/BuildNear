import { Suspense } from "react";
import Link from "next/link";
import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { events } from "@/db/schema";
import { BADGE_FIELDS } from "@/lib/badge-levels";
import { requireAdmin } from "@/lib/organizer";
import { EventTimes } from "@/components/DateTimeField";
import { createEvent, setEventCoords, setEventField } from "./actions";

const input = "min-h-12 w-full rounded-[12px] border border-line bg-card px-4";
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
        <label className="flex flex-col gap-1 text-sm font-medium">
          Badge field (what people earn levels in)
          <select name="field" defaultValue="" className={input}>
            <option value="">No field badge</option>
            {BADGE_FIELDS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">Luma link (optional)<input name="lumaUrl" type="url" className={input} /></label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Venue on the map (optional)
          <input name="coords" placeholder="13.7563, 100.5018 (copy from a maps app)" className={input} />
        </label>
        {sp.error === "coords" ? <p className="text-sm text-red-600">That does not look like coordinates. Use the form 13.7563, 100.5018.</p> : sp.error && <p className="text-sm text-red-600">Check the fields. The end must be after the start.</p>}
        {sp.updated && <p className="text-sm text-green-700 dark:text-green-400">Badge field updated.</p>}
        {sp.created && <p className="text-sm text-green-700 dark:text-green-400">Event created.</p>}
        <button className="min-h-12 rounded-[14px] bg-yellow px-6 font-semibold text-[#202127]" type="submit">Create event</button>
      </form>

      <section className="flex flex-col gap-3">
        <h2 className="font-medium">Events</h2>
        <ul className="flex flex-col gap-3">
          {list.map((e) => (
            <li key={e.id} className="rounded-[18px] bg-card p-4">
              <p className="font-medium">{e.title}</p>
              <p className="text-xs text-muted">{e.venue} · {fmt(e.startsAt)} to {fmt(e.endsAt)}</p>
              <form action={setEventField} className="mt-2 flex gap-2">
                <input type="hidden" name="id" value={e.id} />
                <select name="field" defaultValue={e.field ?? ""} aria-label="Badge field" className="min-h-11 flex-1 rounded-[12px] border border-line bg-card px-3 text-sm">
                  <option value="">No field badge</option>
                  {BADGE_FIELDS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
                </select>
                <button type="submit" className="min-h-11 rounded-[14px] border border-line bg-card px-4 text-sm font-medium">Save</button>
              </form>
              <form action={setEventCoords} className="mt-2 flex gap-2">
                <input type="hidden" name="id" value={e.id} />
                <input name="coords" defaultValue={e.venueLat !== null && e.venueLon !== null ? `${e.venueLat}, ${e.venueLon}` : ""} placeholder="Map location: 13.7563, 100.5018" aria-label="Venue map location" className="min-h-11 flex-1 rounded-[12px] border border-line bg-card px-3 text-sm" />
                <button type="submit" className="min-h-11 rounded-[14px] border border-line bg-card px-4 text-sm font-medium">Save</button>
              </form>
              <p className="mt-1 text-xs text-muted">Typed code: <span className="font-mono">{e.checkInCode}</span></p>
              <Link href={`/events/${e.slug}/qr`} className="mt-3 flex min-h-11 items-center justify-center rounded-[14px] bg-yellow px-4 text-sm font-semibold text-[#202127]">
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
      <Link href="/admin/evaluation" className="text-sm underline">Brain evaluation (admin)</Link>
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <AdminView searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}
