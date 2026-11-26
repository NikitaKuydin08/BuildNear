import Image from "next/image";
import { BADGE_FIELDS, BADGE_LEVELS, badgeSrc, levelIndex } from "@/lib/badge-levels";

type Row = { field: string; count: number };

// One badge per field the person has checked in for. `showNext` adds the progress line (own badges only).
export function BadgeShelf({ rows, showNext = false, skip }: { rows: Row[]; showNext?: boolean; skip?: string }) {
  const items = BADGE_FIELDS.map((f) => ({ f, count: rows.find((r) => r.field === f.key)?.count ?? 0 }))
    .filter((x) => levelIndex(x.count) >= 0 && x.f.key !== skip)
    .sort((a, b) => b.count - a.count);
  if (items.length === 0) return null;
  return (
    <ul className="grid grid-cols-2 gap-3">
      {items.map(({ f, count }) => {
        const i = levelIndex(count);
        const level = BADGE_LEVELS[i];
        const next = BADGE_LEVELS[i + 1];
        return (
          <li key={f.key} className="flex flex-col items-center rounded-[18px] bg-card p-4 text-center">
            <Image src={badgeSrc(f.folder, level.file)} alt={`${f.label} ${level.name}`} width={120} height={100} unoptimized className="h-auto w-full max-w-[120px]" />
            <p className="mt-2 text-[14px] font-semibold">{level.name}</p>
            <p className="text-[12px] text-muted">{f.label} · {count} {count === 1 ? "event" : "events"}</p>
            {showNext && next && <p className="mt-1 text-[11px] text-purple">{next.at - count} more to {next.name}</p>}
          </li>
        );
      })}
    </ul>
  );
}
