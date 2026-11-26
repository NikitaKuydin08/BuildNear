"use client";

import { useState } from "react";
import { deleteAccount } from "@/app/profile/actions";

// Two steps on the page itself (no browser pop-up, which in-app browsers such as Telegram's can block).
export function DeleteAccountButton() {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <button
        type="button"
        onClick={() => setAsking(true)}
        className="min-h-12 w-full rounded-full border border-red-300 px-6 font-medium text-red-700 dark:border-red-900 dark:text-red-400"
      >
        Delete my account
      </button>
    );
  }
  return (
    <form action={deleteAccount} className="flex flex-col gap-2 rounded-2xl border border-red-300 p-3 dark:border-red-900">
      <p className="text-sm">Delete your account and all your data? This cannot be undone.</p>
      <div className="flex gap-2">
        <button type="submit" className="min-h-12 flex-1 rounded-full bg-red-600 px-4 font-medium text-white">Yes, delete everything</button>
        <button type="button" onClick={() => setAsking(false)} className="min-h-12 flex-1 rounded-full border border-neutral-300 px-4 font-medium dark:border-neutral-700">Cancel</button>
      </div>
    </form>
  );
}
