"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui";

// Figma tab bar: People · Event · Chats · Badges. "Nearby" has no Figma screen; it is kept as a fifth tab in the same style.
const items: { href: string; label: string; icon: IconName; match: string[] }[] = [
  { href: "/people", label: "People", icon: "people", match: ["/people"] },
  { href: "/events", label: "Events", icon: "calendar", match: ["/events"] },
  { href: "/nearby", label: "Nearby", icon: "pin", match: ["/nearby"] },
  { href: "/inbox", label: "Chats", icon: "chat", match: ["/inbox"] },
  { href: "/badges", label: "Badges", icon: "badge", match: ["/badges"] },
];

// One-step-deep screens use a back button instead of the tab bar (as in the Figma flow).
const HIDDEN = [
  /^\/$/,
  /^\/privacy/,
  /^\/profile/,
  /^\/events\/[^/]+\/(checkin|welcome|visibility|qr)/,
  /^\/people\/filters/,
  /^\/people\/[^/]+\/(intro|sent)/,
  /^\/inbox\/[^/]+/,
  /^\/badges\/(wallet|claimed)/,
];

export function BottomNav() {
  const pathname = usePathname();
  if (HIDDEN.some((r) => r.test(pathname))) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 backdrop-blur">
      <ul className="mx-auto flex max-w-md gap-1 px-3 pt-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        {items.map((item) => {
          const active = item.match.some((m) => pathname === m || pathname.startsWith(m + "/"));
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-[54px] flex-col items-center justify-center gap-[3px] rounded-[14px] text-[11px] font-medium ${
                  active ? "bg-lilac text-purple" : "text-muted"
                }`}
              >
                <Icon name={item.icon} size={22} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
