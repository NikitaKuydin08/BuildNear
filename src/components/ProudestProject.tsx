"use client";

import { useState } from "react";
import Link from "next/link";

type P = { title: string; description: string; stack: string; url: string };

const input = "min-h-12 w-full rounded-xl border border-neutral-300 bg-transparent px-4 dark:border-neutral-700";
const outline = "flex min-h-12 w-full items-center justify-center rounded-full border border-neutral-300 px-6 text-sm font-medium dark:border-neutral-700";

// Collapsed by default. The fields stay in the form while hidden, so saving never loses the project.
export function ProudestProject({ initial }: { initial: P | null }) {
  const [open, setOpen] = useState(false);
  const has = !!initial?.title;

  return (
    <div className="flex flex-col gap-3">
      {has && !open && (
        <div className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
          <p className="font-medium">{initial!.title}</p>
          {initial!.description && <p className="text-sm text-neutral-500">{initial!.description}</p>}
        </div>
      )}

      <div hidden={!open} className="flex flex-col gap-2">
        <input name="pftitle" defaultValue={initial?.title ?? ""} placeholder="Title" maxLength={60} className={input} />
        <input name="pfdesc" defaultValue={initial?.description ?? ""} placeholder="One line about it" maxLength={140} className={input} />
        <input name="pfstack" defaultValue={initial?.stack ?? ""} placeholder="Stack (comma separated)" className={input} />
        <input name="pfurl" defaultValue={initial?.url ?? ""} placeholder="Link (optional, https://…)" autoCapitalize="none" className={input} />
      </div>

      <div className="flex flex-col gap-2">
        <button type="button" onClick={() => setOpen(!open)} className={outline}>
          {open ? "Hide" : has ? "Edit" : "Write it myself"}
        </button>
        <Link href="/profile/repos" className={outline}>Pick it from my GitHub repositories</Link>
      </div>
    </div>
  );
}
