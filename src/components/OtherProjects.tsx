"use client";

import { useState } from "react";
import { removeProject } from "@/app/profile/actions";

// `id` exists only for projects that are already saved.
type P = { id?: string; title: string; description: string; stack: string; url: string };

const input = "min-h-12 w-full rounded-xl border border-neutral-300 bg-transparent px-4 dark:border-neutral-700";
const MAX = 3;

// Shows only the projects you have, plus a button to add the next one (1/3, 2/3, 3/3), so the page stays short.
// Fields are named o0..o2. Remove deletes a saved project right away (after a confirmation); a project you have not saved yet just disappears.
export function OtherProjects({ initial }: { initial: P[] }) {
  const [slots, setSlots] = useState<number[]>(initial.map((_, i) => i));
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState(false);

  function add() {
    const free = [0, 1, 2].find((i) => !slots.includes(i));
    if (free !== undefined) setSlots([...slots, free]);
  }

  async function remove(i: number) {
    const saved = initial[i]?.id;
    if (saved) {
      if (!window.confirm("Remove this project? This deletes it from your profile.")) return;
      setBusy(i);
      setError(false);
      try {
        const res = await removeProject(saved);
        if (!res.ok) throw new Error("failed");
      } catch {
        setError(true);
        setBusy(null);
        return;
      }
      setBusy(null);
    }
    setSlots((s) => s.filter((x) => x !== i));
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-sm text-red-600">Could not remove it. Try again.</p>}
      {slots.map((i, n) => {
        const p = initial[i];
        return (
          <div key={i} className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Project {n + 1}/{MAX}</p>
              <button type="button" disabled={busy === i} onClick={() => remove(i)} className="min-h-11 px-2 text-sm text-neutral-500 underline disabled:opacity-50">
                {busy === i ? "Removing…" : "Remove"}
              </button>
            </div>
            <input name={`o${i}title`} defaultValue={p?.title ?? ""} placeholder="Title" maxLength={60} className={input} />
            <input name={`o${i}desc`} defaultValue={p?.description ?? ""} placeholder="One line about it" maxLength={140} className={input} />
            <input name={`o${i}stack`} defaultValue={p?.stack ?? ""} placeholder="Stack (comma separated)" className={input} />
            <input name={`o${i}url`} defaultValue={p?.url ?? ""} placeholder="Link (optional, https://…)" autoCapitalize="none" className={input} />
          </div>
        );
      })}
      {slots.length < MAX && (
        <button
          type="button"
          onClick={add}
          className="flex min-h-12 items-center justify-center rounded-full border border-neutral-300 px-6 text-sm font-medium dark:border-neutral-700"
        >
          {slots.length === 0 ? `Add a project (1/${MAX})` : `Add another project (${slots.length + 1}/${MAX})`}
        </button>
      )}
    </div>
  );
}
