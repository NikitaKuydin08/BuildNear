import Image from "next/image";
import { BADGE_FIELDS, BADGE_LEVELS, badgeSrc, levelIndex } from "@/lib/badge-levels";

type Row = { field: string; count: number };

// One badge per field the person has checked in for. `showNext` adds the progress line (own profile only).
export function BadgeShelf({ rows, showNext = false }: { rows: Row[]; showNext?: boolean }) {
  const items = BADGE_FIELDS.map((f) => ({ f, count: rows.find((r) => r.field === f.key)?.count ?? 0 }))
    .filter((x) => levelIndex(x.count) >= 0)
    .sort((a, b) => b.count - a.count);
  if (items.length === 0) return null;
  return (
    <ul className="grid grid-cols-2 gap-3">
      {items.map(({ f, count }) => {
        const i = levelIndex(count);
        const level = BADGE_LEVELS[i];
        const next = BADGE_LEVELS[i + 1];
        return (
          <li key={f.key} className="flex flex-col items-center rounded-2xl border border-neutral-200 p-3 text-center dark:border-neutral-800">
            <Image src={badgeSrc(f.folder, level.file)} alt={`${f.label} ${level.name}`} width={180} height={150} unoptimized className="h-auto w-full max-w-[180px]" />
            <p className="mt-1 text-sm font-medium">{f.label} · {level.name}</p>
            <p className="text-xs text-neutral-500">
              {count} {count === 1 ? "event" : "events"}
              {showNext && next ? ` · ${next.at - count} more to ${next.name}` : ""}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
