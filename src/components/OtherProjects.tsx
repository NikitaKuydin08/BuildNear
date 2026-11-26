"use client";

import { useState } from "react";

type P = { title: string; description: string; stack: string; url: string };

const input = "min-h-12 w-full rounded-xl border border-neutral-300 bg-transparent px-4 dark:border-neutral-700";
const MAX = 3;

// Shows only the projects you have, plus a button to add the next one (1/3, 2/3, 3/3), so the page stays short.
// Fields are named o0..o2; a removed project's fields leave the form, so saving deletes it.
export function OtherProjects({ initial }: { initial: P[] }) {
  const [slots, setSlots] = useState<number[]>(initial.map((_, i) => i));

  function add() {
    const free = [0, 1, 2].find((i) => !slots.includes(i));
    if (free !== undefined) setSlots([...slots, free]);
  }

  return (
    <div className="flex flex-col gap-3">
      {slots.map((i, n) => {
        const p = initial[i];
        return (
          <div key={i} className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Project {n + 1}/{MAX}</p>
              <button type="button" onClick={() => setSlots(slots.filter((s) => s !== i))} className="min-h-11 px-2 text-sm text-neutral-500 underline">
                Remove
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
