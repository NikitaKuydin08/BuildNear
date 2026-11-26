"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Icon, btnPrimary, btnSecondary } from "@/components/ui";
import { stopSharing, updateLocation } from "@/app/nearby/actions";


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
      <div className="flex flex-col gap-4 rounded-[18px] bg-lilac p-5">
        <div className="flex gap-3">
          <span className="text-purple"><Icon name="shield" /></span>
          <div>
            <p className="text-[15px] font-semibold">You’re visible nearby{until ? ` until about ${until}` : ""}</p>
            <p className="mt-1 text-[13px] leading-[19px] text-muted">Only your approximate area is stored (about 1 km), never exact coordinates. It disappears after 4 hours unless you open this tab again.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={locate} disabled={pending} className={btnPrimary}>Update now</button>
          <button onClick={() => start(async () => { await stopSharing(); })} disabled={pending} className={btnSecondary}>Stop sharing</button>
        </div>
        {error && <p className="text-[13px] text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-[18px] bg-lilac p-5">
      <div className="flex gap-3">
        <span className="text-purple"><Icon name="pin" /></span>
        <div>
          <p className="text-[15px] font-semibold">Find builders around you right now</p>
          <p className="mt-1 text-[13px] leading-[19px] text-muted">
            If you share, other people who share can see you here. We store only your approximate area (about 1 km), only your latest position, and delete it after 4 hours or when you stop. Nobody sees coordinates, only “same area” or an approximate distance.{" "}
            <Link href="/privacy" className="underline">Privacy notice</Link>
          </p>
        </div>
      </div>
      <button onClick={locate} disabled={pending} className={btnPrimary}>
        {pending ? "Saving…" : "Share my area"}
      </button>
      {error && <p className="text-[13px] text-red-600">{error}</p>}
    </div>
  );
}
