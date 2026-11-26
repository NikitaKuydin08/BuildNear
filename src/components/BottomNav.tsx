"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/events", label: "Events" },
  { href: "/nearby", label: "Nearby" },
  { href: "/inbox", label: "Inbox" },
  { href: "/profile", label: "Profile" },
];

export function BottomNav() {
  const pathname = usePathname();
  if (pathname === "/" || pathname === "/privacy") return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-neutral-200 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
      <ul className="mx-auto flex max-w-md pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`flex min-h-14 items-center justify-center text-sm font-medium ${
                  active ? "text-black dark:text-white" : "text-neutral-500"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
