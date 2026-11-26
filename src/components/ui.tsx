import Link from "next/link";

// Small design kit that follows the BuildNear Figma mobile screens (390 px wide, Inter, yellow + purple).
// Class strings are exported so forms and links can share the exact button look.

const ICONS: Record<string, React.ReactNode> = {
  people: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M16 3a4 4 0 0 1 0 8" />
      <circle cx="9" cy="7" r="4" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </>
  ),
  chat: <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" />,
  badge: (
    <>
      <circle cx="12" cy="8" r="6" />
      <path d="m8.2 13-1 9L12 19l4.8 3-1-9" />
    </>
  ),
  arrow: <path d="m9 18 6-6-6-6" />,
  back: <path d="m15 18-6-6 6-6" />,
  check: <path d="m5 12 4 4L19 6" />,
  shield: (
    <>
      <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  filter: (
    <>
      <path d="M4 7h16M4 17h16" />
      <circle cx="8" cy="7" r="2" />
      <circle cx="16" cy="17" r="2" />
    </>
  ),
  link: <path d="M10 13a5 5 0 0 0 7 .1l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7-.1l-3 3a5 5 0 0 0 7 7l1.7-1.7" />,
  plus: <path d="M12 5v14M5 12h14" />,
  send: <path d="m22 2-7 20-4-9-9-4Z M22 2 11 13" />,
  code: <path d="m16 18 6-6-6-6M8 6l-6 6 6 6m6-14-4 16" />,
  // Not in the Figma kit: drawn in the same 24 px, 1.7 stroke style for features the kit has no screen for.
  pin: (
    <>
      <path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  undo: <path d="M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  folder: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />,
  spark: <path d="M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7Z" />,
  external: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
};

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 24, className = "" }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={`shrink-0 ${className}`}
    >
      {ICONS[name]}
    </svg>
  );
}

// Buttons: 52 px tall, 14 px corners, 15 px semibold (Figma "button" component).
export const btnPrimary =
  "flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-yellow px-5 text-[15px] font-semibold text-[#202127] hover:brightness-[.97] disabled:opacity-40";
export const btnSecondary =
  "flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[14px] border border-line bg-card px-5 text-[15px] font-semibold text-ink hover:brightness-[.98] disabled:opacity-40";
export const inputCls =
  "min-h-[52px] w-full rounded-[12px] border border-line bg-card px-4 text-[15px] font-normal normal-case tracking-normal text-ink placeholder:text-muted";

export function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-[11px] font-semibold uppercase leading-[15px] tracking-[1.3px] text-purple ${className}`}>{children}</p>;
}

export function Title({ children, size = 32, className = "" }: { children: React.ReactNode; size?: 27 | 30 | 32 | 36; className?: string }) {
  const s = { 27: "text-[27px] leading-[33px]", 30: "text-[30px] leading-[36px]", 32: "text-[32px] leading-[38px]", 36: "text-[36px] leading-[42px]" }[size];
  return <h1 className={`${s} font-semibold tracking-[-0.6px] text-ink ${className}`}>{children}</h1>;
}

export function Lead({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-[15px] leading-[21px] text-muted ${className}`}>{children}</p>;
}

export function SectionLabel({ children, right, className = "" }: { children: React.ReactNode; right?: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center justify-between gap-2 ${className}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[1.1px] text-muted">{children}</p>
      {right}
    </div>
  );
}

export function Chip({ children, tone = "grey" }: { children: React.ReactNode; tone?: "grey" | "lilac" }) {
  return (
    <span
      className={`inline-flex h-[30px] items-center rounded-[8px] px-3 text-[12px] font-medium ${
        tone === "lilac" ? "bg-lilac text-purple" : "bg-soft text-muted"
      }`}
    >
      {children}
    </span>
  );
}

export function Chips({ items, tone = "grey", max = 6 }: { items: string[]; tone?: "grey" | "lilac"; max?: number }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-[7px]">
      {items.slice(0, max).map((s) => (
        <Chip key={s} tone={tone}>
          {s}
        </Chip>
      ))}
    </div>
  );
}

// Header for screens that are one step deep: back chevron + title (+ a purple line under it).
export function BackBar({ href, title, sub }: { href: string; title: string; sub?: string }) {
  return (
    <header className="sticky top-0 z-20 bg-bg/95 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="flex min-h-[68px] items-center gap-2 px-3">
        <Link href={href} aria-label="Back" className="flex size-11 items-center justify-center rounded-[12px] text-ink hover:bg-purple/5">
          <Icon name="back" />
        </Link>
        <div className="min-w-0">
          <p className="truncate text-[19px] font-semibold leading-[26px] text-ink">{title}</p>
          {sub && <p className="truncate text-[11px] leading-[15px] text-purple">{sub}</p>}
        </div>
      </div>
    </header>
  );
}

export function Screen({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <main className={`flex flex-col px-5 pb-8 ${className}`}>{children}</main>;
}

// Big rounded square with an icon (the "checked in", "sent" and "collectible" moments).
export function IconBubble({ name, size = 106 }: { name: IconName; size?: 106 | 116 | 64 }) {
  const r = size === 64 ? "rounded-[20px]" : size === 116 ? "rounded-[38px]" : "rounded-[35px]";
  return (
    <div style={{ width: size, height: size }} className={`flex items-center justify-center bg-lilac text-purple ${r}`}>
      <Icon name={name} size={size === 64 ? 28 : 46} />
    </div>
  );
}

const posterDate = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Bangkok", weekday: "short", day: "numeric", month: "short" });
const posterTime = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit" });

export function eventWhen(d: Date) {
  return `${posterDate.format(d)} · ${posterTime.format(d)}`;
}

// The yellow event poster (Figma "SHIP & SIP" card): big uppercase title, code icon, date line.
export function Poster({ title, startsAt, compact = false }: { title: string; startsAt: Date; compact?: boolean }) {
  const words = title.toUpperCase().split(/\s+/);
  // Two lines like the Figma poster ("SHIP / & SIP"): a lone "&" or "+" starts the second line.
  let cut = Math.ceil(words.length / 2);
  if (cut > 1 && /^[&+]$/.test(words[cut - 1])) cut -= 1;
  const lines = words.length > 2 ? [words.slice(0, cut).join(" "), words.slice(cut).join(" ")] : words;
  const long = title.length > 18;
  return (
    <div className={`relative overflow-hidden rounded-[24px] bg-yellow p-5 text-[#202127] ${compact ? "min-h-[180px]" : "min-h-[208px]"}`}>
      {!compact && <p className="text-[10px] font-semibold uppercase tracking-[1px]">BuildNear / Community sessions</p>}
      <p className={`${compact ? "mt-1" : "mt-4"} max-w-[75%] break-words font-semibold tracking-[-1px] ${long ? "text-[34px] leading-[36px]" : "text-[48px] leading-[49px]"}`}>
        {lines.map((l, i) => (
          <span key={i} className="block">
            {l}
          </span>
        ))}
      </p>
      <span className="absolute right-6 top-1/2 -translate-y-1/4">
        <Icon name="code" size={60} />
      </span>
      {compact ? (
        <p className="mt-5 text-[10px] font-semibold uppercase tracking-[1px]">BuildNear / Community sessions</p>
      ) : (
        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.5px]">{eventWhen(startsAt)} · Bangkok time</p>
      )}
    </div>
  );
}

// Lilac pill at the top of People / Chats: which event you are at.
export function EventPill({ href, title, sub }: { href: string; title: string; sub: string }) {
  return (
    <Link href={href} className="flex min-h-[52px] items-center gap-3 rounded-[14px] bg-lilac px-4 text-purple">
      <Icon name="calendar" size={20} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-semibold leading-[19px] text-ink">{title}</span>
        <span className="block truncate text-[11px] leading-[15px] text-muted">{sub}</span>
      </span>
      <Icon name="arrow" size={20} />
    </Link>
  );
}

// A small line at the bottom of a screen (the Figma screens end with one).
export function FootNote({ children }: { children: React.ReactNode }) {
  return <p className="mt-6 text-center text-[11px] leading-[16px] text-muted">{children}</p>;
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : parts[0]?.[1] ?? "")).toUpperCase() || "?";
}

export const firstName = (name: string) => name.trim().split(/\s+/)[0] || name;
