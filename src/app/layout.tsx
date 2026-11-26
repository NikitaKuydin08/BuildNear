import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BuildNear",
  description: "Find builders to talk to at events, cafes and co-working spaces.",
  appleWebApp: { capable: true, title: "BuildNear", statusBarStyle: "black-translucent" },
  icons: { icon: "/icon-192.png", apple: "/apple-touch-icon.png" },
};

// Mobile-first: fill the phone screen, including the notch area.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b0b0f",
};

// Set the theme before first paint (saved choice, else the phone setting) so there is no white flash.
const THEME_SCRIPT = "try{var t=localStorage.getItem('theme');var d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d)}catch(e){}";

function Mark() {
  return (
    <svg width="28" height="18" viewBox="0 0 28 18" aria-hidden>
      <defs><clipPath id="m"><circle cx="9" cy="9" r="8.5" /></clipPath></defs>
      <circle cx="9" cy="9" r="8.5" fill="#f2b705" />
      <circle cx="19" cy="9" r="8.5" fill="#8e5cf0" />
      <circle cx="19" cy="9" r="8.5" fill="#fff" clipPath="url(#m)" />
    </svg>
  );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {/* Always dark, so the white iPhone status bar text stays readable in both themes. */}
        <header className="fixed inset-x-0 top-0 z-20 bg-[#0b0b0f] pt-[env(safe-area-inset-top)]">
          <div className="mx-auto flex h-12 max-w-md items-center justify-between px-4">
            <Link href="/events" className="flex items-center gap-2 font-semibold text-white"><Mark />BuildNear</Link>
            <ThemeToggle />
          </div>
        </header>
        <div className="mx-auto w-full max-w-md flex-1 pt-[calc(3rem+env(safe-area-inset-top))] pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
          {children}
          <footer className="px-4 pb-6 pt-2 text-center text-xs text-neutral-500">
            <Link href="/privacy" className="underline">Privacy &amp; data</Link>
          </footer>
        </div>
        <Suspense fallback={null}>
          <BottomNav />
        </Suspense>
      </body>
    </html>
  );
}
