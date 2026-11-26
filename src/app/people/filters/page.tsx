import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackBar, Eyebrow, Icon, Lead, SectionLabel, Screen, Title, btnPrimary, inputCls } from "@/components/ui";
import { FIELDS } from "@/lib/fields";
import { filterQuery, parseFilters, type FeedFilters } from "@/lib/feed-filters";
import { getAttendance, getEventBySlug, listAttendees } from "@/lib/queries";
import { requireUserId } from "@/lib/session";

type Props = PageProps<"/people/filters">;

const option = (on: boolean) =>
  `flex min-h-[52px] w-full items-center justify-center rounded-[14px] border text-[15px] font-semibold ${on ? "border-purple bg-lilac text-purple" : "border-line bg-card text-ink"}`;
const small = (on: boolean) =>
  `flex min-h-11 items-center justify-center rounded-[12px] border px-3 text-[13px] font-medium ${on ? "border-purple bg-lilac text-purple" : "border-line bg-card text-ink"}`;

// Figma 07 · Filter people. Every option is a plain link back to the feed with the filter in the URL.
// Tech stack follows the Figma screen; meeting style and field are existing filters without a Figma screen, styled the same way.
async function Filters({ searchParams }: { searchParams: Props["searchParams"] }) {
  const sp = await searchParams;
  const slug = typeof sp.event === "string" ? sp.event : "";
  const tab = typeof sp.tab === "string" ? sp.tab : "";
  const meId = await requireUserId("/people");
  const event = slug ? await getEventBySlug(slug) : null;
  if (!event) notFound();
  const att = await getAttendance(meId, event.id);
  if (!att?.checkedInAt) notFound();

  const f = parseFilters(sp);
  const feed = (next: Partial<FeedFilters>) => {
    const q = filterQuery({ ...f, ...next });
    return `/people?event=${slug}${tab ? `&tab=${tab}` : ""}${q ? `&${q}` : ""}`;
  };

  // The stacks people at this event actually use, most common first.
  const people = await listAttendees(event.id, meId);
  const counts = new Map<string, { label: string; n: number }>();
  for (const { user } of people) for (const s of new Set(user.stack.map((x) => x.trim()).filter(Boolean))) {
    const k = s.toLowerCase();
    counts.set(k, { label: counts.get(k)?.label ?? s, n: (counts.get(k)?.n ?? 0) + 1 });
  }
  const stacks = [...counts.values()].sort((a, b) => b.n - a.n).slice(0, 5);
  const fieldsHere = FIELDS.filter((fl) => people.some(({ user }) => user.topics.includes(fl.key)));

  return (
    <Screen>
      <Eyebrow className="mt-2">A little common ground</Eyebrow>
      <Title className="mt-3">
        Start with
        <br />
        a shared stack.
      </Title>
      <Lead className="mt-4 text-[14px]">Or meet someone who brings a new skill.</Lead>

      <SectionLabel className="mt-9">Tech stack</SectionLabel>
      <div className="mt-3 flex flex-col gap-4">
        <Link href={feed({ stack: "" })} className={option(!f.stack)}>Any stack</Link>
        {stacks.map((s) => (
          <Link key={s.label} href={feed({ stack: s.label })} className={option(f.stack.toLowerCase() === s.label.toLowerCase())}>
            {s.label}
            <span className="ml-2 text-[12px] font-medium text-muted">{s.n}</span>
          </Link>
        ))}
      </div>
      <form action="/people" method="get" className="mt-3 flex gap-2">
        <input type="hidden" name="event" value={slug} />
        {tab && <input type="hidden" name="tab" value={tab} />}
        {f.meet && <input type="hidden" name="meet" value={f.meet} />}
        {f.field && <input type="hidden" name="field" value={f.field} />}
        <input name="stack" maxLength={30} defaultValue={stacks.some((s) => s.label.toLowerCase() === f.stack.toLowerCase()) ? "" : f.stack} placeholder="Another stack, e.g. Rust" aria-label="Another stack" className={`${inputCls} flex-1`} />
        <button type="submit" className="rounded-[14px] bg-yellow px-5 text-[15px] font-semibold text-[#202127]">Go</button>
      </form>

      <SectionLabel className="mt-8">Meeting style</SectionLabel>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link href={feed({ meet: "" })} className={small(!f.meet)}>Any</Link>
        <Link href={feed({ meet: "in_person" })} className={small(f.meet === "in_person")}>In person</Link>
        <Link href={feed({ meet: "open" })} className={small(f.meet === "open")}>Open to meeting</Link>
        <Link href={feed({ meet: "chat_first" })} className={small(f.meet === "chat_first")}>Chat first</Link>
      </div>

      {fieldsHere.length > 0 && (
        <>
          <SectionLabel className="mt-8">Field</SectionLabel>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={feed({ field: "" })} className={small(!f.field)}>Any field</Link>
            {fieldsHere.map((fl) => (
              <Link key={fl.key} href={feed({ field: fl.key })} className={small(f.field === fl.key)}>{fl.label}</Link>
            ))}
          </div>
        </>
      )}

      <div className="mt-8 flex gap-3 rounded-[16px] bg-lilac p-5">
        <span className="text-purple"><Icon name="shield" /></span>
        <p className="text-[13px] font-semibold leading-[20px]">
          Only people who joined this event.
          <br />
          No location permissions required.
        </p>
      </div>

      <Link href={`/people?event=${slug}${tab ? `&tab=${tab}` : ""}`} className={`${btnPrimary} mt-8`}>
        Show all builders
      </Link>
    </Screen>
  );
}

async function Back({ searchParams }: { searchParams: Props["searchParams"] }) {
  const sp = await searchParams;
  const slug = typeof sp.event === "string" ? sp.event : "";
  const tab = typeof sp.tab === "string" ? sp.tab : "";
  const q = filterQuery(parseFilters(sp));
  return <BackBar href={`/people${slug ? `?event=${slug}${tab ? `&tab=${tab}` : ""}${q ? `&${q}` : ""}` : ""}`} title="Find your people" />;
}

export default function FiltersPage(props: Props) {
  return (
    <>
      <Suspense fallback={null}>
        <Back searchParams={props.searchParams} />
      </Suspense>
      <Suspense fallback={<p className="p-5 text-muted">Loading…</p>}>
        <Filters searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}
