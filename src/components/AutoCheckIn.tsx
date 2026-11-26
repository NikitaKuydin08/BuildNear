"use client";

import { useEffect, useRef } from "react";

// Submits the check-in form as soon as the page opens (after scanning the QR and signing in).
// Prefetching and link previews never run this, because it needs a real browser to execute.
export function AutoCheckIn({ action, slug, code, token, title }: { action: (formData: FormData) => void | Promise<void>; slug: string; code: string; token: string; title: string }) {
  const ref = useRef<HTMLFormElement>(null);
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    ref.current?.requestSubmit();
  }, []);
  return (
    <form ref={ref} action={action} className="flex flex-col gap-3">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="code" value={code} />
      <input type="hidden" name="token" value={token} />
      <p className="text-sm text-neutral-500">Checking you in to {title}…</p>
      <button className="min-h-12 rounded-full bg-accent px-6 font-medium text-black" type="submit">If nothing happens, tap here</button>
    </form>
  );
}
