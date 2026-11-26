import Link from "next/link";
import { FIELDS } from "@/lib/fields";
import { hasFilters, type FeedFilters as Filters } from "@/lib/feed-filters";

const box = "min-h-11 rounded-xl border border-neutral-300 bg-transparent px-3 text-sm dark:border-neutral-700";

// A plain GET form: no JavaScript needed. `base` is the feed page, e.g. "/people?event=x" or "/events/x".
export function FeedFilters({ base, tab, filters }: { base: string; tab: string; filters: Filters }) {
  const [path, qs] = base.split("?");
  const keep = [...new URLSearchParams(qs ?? "").entries()].filter(([k]) => !["meet", "stack", "field", "tab"].includes(k));
  const clear = `${path}?${new URLSearchParams([...keep, ...(tab !== "everyone" ? [["tab", tab]] : [])]).toString()}`;
  return (
    <details className="rounded-2xl border border-neutral-200 p-3 dark:border-neutral-800" open={hasFilters(filters)}>
      <summary className="cursor-pointer text-sm font-medium">
        Filters{hasFilters(filters) ? " (on)" : ""}
      </summary>
      <form action={path} method="get" className="mt-3 flex flex-col gap-2">
        {keep.map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
        {tab !== "everyone" && <input type="hidden" name="tab" value={tab} />}
        <select name="meet" defaultValue={filters.meet} aria-label="Meeting preference" className={box}>
          <option value="">Any meeting style</option>
          <option value="in_person">Happy to meet in person</option>
          <option value="open">Open to meeting</option>
          <option value="chat_first">Chat first</option>
        </select>
        <select name="field" defaultValue={filters.field} aria-label="Field" className={box}>
          <option value="">Any field</option>
          {FIELDS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
        </select>
        <input name="stack" defaultValue={filters.stack} maxLength={30} placeholder="Stack, e.g. Rust" aria-label="Stack" className={box} />
        <div className="flex gap-2">
          <button type="submit" className="min-h-11 flex-1 rounded-full bg-accent px-4 text-sm font-medium text-black">Apply</button>
          {hasFilters(filters) && <Link href={clear} className="flex min-h-11 flex-1 items-center justify-center rounded-full border border-neutral-300 px-4 text-sm font-medium dark:border-neutral-700">Clear</Link>}
        </div>
      </form>
    </details>
  );
}
