"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { stopSharing, updateLocation } from "@/app/nearby/actions";

const btn = "min-h-12 rounded-full px-6 font-medium";

// Explicit, opt-in. The browser's own permission prompt only appears after the user taps the button.
export function LocationPanel({ sharing, until }: { sharing: boolean; until: string | null }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function locate() {
    setError(null);
    if (!("geolocation" in navigator)) return setError("This browser can't share location.");
    navigator.geolocation.getCurrentPosition(
      (pos) => start(async () => { const r = await updateLocation(pos.coords.latitude, pos.coords.longitude); if (!r.ok) setError("Could not save your location."); }),
      (err) => setError(err.code === err.PERMISSION_DENIED ? "Location permission was denied. You can allow it in your browser settings." : "Could not get your location."),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 },
    );
  }

  // If you already opted in and the browser already allows it, quietly refresh once each time this tab opens.
  useEffect(() => {
    if (!sharing || !("permissions" in navigator)) return;
    navigator.permissions.query({ name: "geolocation" }).then((p) => { if (p.state === "granted") locate(); }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (sharing) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
        <p className="text-sm font-medium">You are visible to people nearby{until ? ` until about ${until}` : ""}.</p>
        <p className="text-xs text-neutral-500">Only your approximate area is stored (about 1 km), never exact coordinates. It disappears after 4 hours unless you open this tab again.</p>
        <div className="flex gap-2">
          <button onClick={locate} disabled={pending} className={`${btn} flex-1 bg-accent text-black`}>Update now</button>
          <button onClick={() => start(async () => { await stopSharing(); })} disabled={pending} className={`${btn} flex-1 border border-neutral-300 dark:border-neutral-700`}>Stop sharing</button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
      <p className="text-sm font-medium">Find builders near you right now</p>
      <p className="text-xs text-neutral-500">
        If you share, other people who share can see you in this tab. We store only your approximate area (rounded to about 1 km), only your latest position, and delete it after 4 hours or when you stop. Nobody sees coordinates, only “same area” or an approximate distance.
        See the <Link href="/privacy" className="underline">privacy notice</Link>.
      </p>
      <button onClick={locate} disabled={pending} className={`${btn} bg-accent text-black`}>
        {pending ? "Saving…" : "Share my area"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
