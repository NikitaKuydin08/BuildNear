import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import localFont from "next/font/local";
import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import "./globals.css";

// Inter, self-hosted (the same file the design uses), so builds never depend on Google Fonts.
const inter = localFont({
  src: "./fonts/Inter.woff2",
  weight: "100 900",
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BuildNear",
  description: "Find builders to talk to at events, cafes and co-working spaces.",
  appleWebApp: { capable: true, title: "BuildNear", statusBarStyle: "default" },
  icons: { icon: "/icon-192.png", apple: "/apple-touch-icon.png" },
};

// Mobile-first: fill the phone screen, including the notch area.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#111114" },
  ],
};

// Set the theme before first paint (saved choice, else the phone setting) so there is no flash.
const THEME_SCRIPT = "try{var t=localStorage.getItem('theme');var d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d)}catch(e){}";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full bg-bg" suppressHydrationWarning>
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
          <div className="flex-1">{children}</div>
          <footer className="px-5 pb-4 pt-2 text-center text-[11px] text-muted">
            <Link href="/privacy" className="underline underline-offset-2">Privacy &amp; data</Link>
          </footer>
        </div>
        <Suspense fallback={null}>
          <BottomNav />
        </Suspense>
      </body>
    </html>
  );
}
