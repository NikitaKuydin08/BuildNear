"use client";

import { useState } from "react";
import { Icon, btnPrimary } from "@/components/ui";

// Figma 02/03: the "Join the event" button stays disabled until the visibility box is ticked.
export function ConsentJoin({ eventTitle }: { eventTitle: string }) {
  const [ok, setOk] = useState(false);
  return (
    <>
      <label className="mt-7 flex cursor-pointer gap-3 rounded-[16px] bg-lilac p-4">
        <input type="checkbox" name="consent" required checked={ok} onChange={(e) => setOk(e.target.checked)} className="peer sr-only" />
        <span
          aria-hidden
          className={`mt-[3px] flex size-6 shrink-0 items-center justify-center rounded-[6px] ${ok ? "bg-purple text-white" : "border border-purple bg-card"} peer-focus-visible:ring-2 peer-focus-visible:ring-purple`}
        >
          {ok && <Icon name="check" size={18} />}
        </span>
        <span className="text-[13px] font-semibold leading-[20px] text-ink">
          Show my profile to people at {eventTitle}. I can hide it anytime.
        </span>
      </label>
      <button type="submit" disabled={!ok} className={`${btnPrimary} mt-8`}>
        Join the event
      </button>
    </>
  );
}
