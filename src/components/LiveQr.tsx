"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Organizer screen: always shows the current QR and counts down to the moment it changes.
export function LiveQr({ slug }: { slug: string }) {
  const [image, setImage] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState(0);
  const [stepMs, setStepMs] = useState(30_000);
  const [leftMs, setLeftMs] = useState(0);
  const [error, setError] = useState(false);
  const skew = useRef(0); // server time minus this device's time
  const busy = useRef(false);

  const load = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const t0 = Date.now();
      const res = await fetch(`/api/qr/${slug}`, { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const d = (await res.json()) as { image: string; expiresAt: number; serverNow: number; stepMs: number };
      skew.current = d.serverNow - (t0 + Date.now()) / 2;
      setImage(d.image);
      setExpiresAt(d.expiresAt);
      setStepMs(d.stepMs);
      setError(false);
    } catch {
      setError(true);
      setExpiresAt(Date.now() + skew.current + 3000); // try again in 3 s
    } finally {
      busy.current = false;
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => {
      if (!expiresAt) return;
      const ms = expiresAt - (Date.now() + skew.current);
      setLeftMs(Math.max(0, ms));
      if (ms <= 0) load();
    }, 200);
    return () => clearInterval(id);
  }, [expiresAt, load]);

  if (error && !image) return <p className="text-red-600">Could not load the QR. Are you signed in as an admin?</p>;
  if (!image) return <p className="text-muted">Loading QR…</p>;

  const secs = Math.ceil(leftMs / 1000);
  const pct = Math.min(100, (leftMs / stepMs) * 100);
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="Check-in QR code" className="w-full rounded-[18px] bg-white p-2" />
      <div className="w-full">
        <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
          <div
            className={`h-full rounded-full transition-[width] duration-200 ${secs <= 5 ? "bg-red-500" : "bg-green-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-center text-sm tabular-nums text-muted">New code in {secs} s</p>
      </div>
      {error && <p className="text-sm text-red-600">Connection problem, retrying…</p>}
    </div>
  );
}
