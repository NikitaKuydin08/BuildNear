"use client";

import { useState } from "react";

// A button that asks "are you sure?" on the page itself (no browser pop-up, which many in-app browsers block).
// Must sit inside a <form>: the second button submits it.
export function ConfirmSubmit({ message, className, children }: { message: string; className?: string; children: React.ReactNode }) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <button type="button" className={className} onClick={() => setAsking(true)}>
        {children}
      </button>
    );
  }
  return (
    <span className="flex flex-col items-end gap-2">
      <span className="text-xs text-muted">{message}</span>
      <span className="flex gap-2">
        <button type="submit" className="min-h-11 rounded-[14px] bg-red-600 px-4 text-sm font-medium text-white">Yes, remove</button>
        <button type="button" onClick={() => setAsking(false)} className="min-h-11 rounded-[14px] border border-line bg-card px-4 text-sm font-medium">Cancel</button>
      </span>
    </span>
  );
}
