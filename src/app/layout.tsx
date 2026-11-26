import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
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
};

// Mobile-first: fill the phone screen, including the notch area.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b0b0f",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <div className="mx-auto w-full max-w-md flex-1 pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
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
