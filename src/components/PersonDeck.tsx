import Link from "next/link";
import { IntroControl } from "@/components/IntroControl";
import { PersonCard, type PersonCardProps } from "@/components/PersonCard";
import { Icon, btnPrimary, btnSecondary } from "@/components/ui";
import type { IntroState } from "@/lib/queries";

export type DeckItem = { card: PersonCardProps; state?: IntroState };

// Adds/replaces ?i= on a feed link.
export function withIndex(base: string, i: number) {
  const [path, qs] = base.split("?");
  const q = new URLSearchParams(qs ?? "");
  if (i > 0) q.set("i", String(i));
  else q.delete("i");
  const s = q.toString();
  return s ? `${path}?${s}` : path;
}

export function parseIndex(v: string | string[] | undefined) {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return Number.isInteger(n) && n > 0 ? n : 0;
}

// Figma 05/06: one person at a time. "Skip" shows the next person, the round button goes back (no swiping).
// Server-rendered with plain links, so it works without JavaScript and the position survives a refresh.
export function PersonDeck({ items, index, base }: { items: DeckItem[]; index: number; base: string }) {
  const n = items.length;
  const i = Math.min(index, n - 1);
  const item = items[i];
  const here = withIndex(base, i);
  const last = i >= n - 1;
  return (
    <div className="flex flex-col">
      <PersonCard {...item.card} />
      <div className="mt-[18px] flex gap-3">
        {i > 0 && (
          <Link href={withIndex(base, i - 1)} aria-label="Previous person" className="flex size-[52px] shrink-0 items-center justify-center rounded-full border border-line bg-card text-muted">
            <Icon name="undo" size={20} />
          </Link>
        )}
        <Link href={withIndex(base, last ? 0 : i + 1)} className={`${btnSecondary} !w-auto shrink-0 px-5`}>
          {last ? (n > 1 ? "Start over" : "Refresh") : <><Icon name="x" size={18} /> Skip</>}
        </Link>
        <div className="min-w-0 flex-1">
          <IntroControl toUserId={item.card.userId} back={here} state={item.state} />
        </div>
      </div>
      <p className="mt-5 text-center text-[12px] text-muted">
        A shared idea is a pretty good icebreaker. <span className="ml-1">{i + 1} / {n}</span>
      </p>
    </div>
  );
}

export function DeckEmpty({ title, body, cta }: { title: string; body: string; cta?: { href: string; label: string } }) {
  return (
    <div className="flex flex-col gap-2 rounded-[22px] bg-card p-6">
      <p className="text-[18px] font-semibold">{title}</p>
      <p className="text-[14px] leading-[20px] text-muted">{body}</p>
      {cta && (
        <Link href={cta.href} className={`${btnPrimary} mt-3`}>
          {cta.label}
        </Link>
      )}
    </div>
  );
}
