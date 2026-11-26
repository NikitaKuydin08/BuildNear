"use client";

import { useState } from "react";
import Link from "next/link";
import { removeProject } from "@/app/profile/actions";

type P = { id?: string; title: string; description: string; stack: string; url: string };

const input = "min-h-12 w-full rounded-[12px] border border-line bg-card px-4";
const outline = "flex min-h-12 w-full items-center justify-center rounded-[14px] border border-line bg-card px-6 text-sm font-medium";

// Collapsed by default. The fields stay in the form while hidden, so saving never loses the project.
// Remove deletes the saved project right away (after a confirmation).
export function ProudestProject({ initial }: { initial: P | null }) {
  const [current, setCurrent] = useState<P | null>(initial);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState(false);
  const has = !!current?.title;

  async function remove() {
    setAsking(false);
    setBusy(true);
    setError(false);
    try {
      if (current?.id) {
        const res = await removeProject(current.id);
        if (!res.ok) throw new Error("failed");
      }
      setCurrent(null);
      setOpen(false);
    } catch {
      setError(true);
    }
    setBusy(false);
  }

  return (
    <div className="flex flex-col gap-3">
      {has && !open && (
        <div className="rounded-[14px] border border-line p-3">
          <p className="font-medium">{current!.title}</p>
          {current!.description && <p className="text-sm text-muted">{current!.description}</p>}
        </div>
      )}

      {/* key: after a removal the fields are rebuilt empty */}
      <div hidden={!open} key={current?.id ?? "empty"} className="flex flex-col gap-2">
        <input name="pftitle" defaultValue={current?.title ?? ""} placeholder="Title" maxLength={60} className={input} />
        <input name="pfdesc" defaultValue={current?.description ?? ""} placeholder="One line about it" maxLength={140} className={input} />
        <input name="pfstack" defaultValue={current?.stack ?? ""} placeholder="Stack (comma separated)" className={input} />
        <input name="pfurl" defaultValue={current?.url ?? ""} placeholder="Link (optional, https://…)" autoCapitalize="none" className={input} />
      </div>

      {error && <p className="text-sm text-red-600">Could not remove it. Try again.</p>}
      <div className="flex flex-col gap-2">
        <button type="button" onClick={() => setOpen(!open)} className={outline}>
          {open ? "Hide" : has ? "Edit" : "Write it myself"}
        </button>
        <Link href="/profile/repos" className={outline}>Pick it from my GitHub repositories</Link>
        {has && !asking && (
          <button type="button" disabled={busy} onClick={() => setAsking(true)} className="min-h-11 text-sm text-muted underline disabled:opacity-50">
            {busy ? "Removing…" : "Remove proudest project"}
          </button>
        )}
        {has && asking && (
          <div className="flex flex-col gap-2 rounded-xl border border-red-300 p-3 dark:border-red-900">
            <p className="text-sm">Delete your proudest project from your profile right away?</p>
            <div className="flex gap-2">
              <button type="button" onClick={remove} className="min-h-11 flex-1 rounded-[14px] bg-red-600 px-4 text-sm font-medium text-white">Yes, delete</button>
              <button type="button" onClick={() => setAsking(false)} className="min-h-11 flex-1 rounded-[14px] border border-line bg-card px-4 text-sm font-medium">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
