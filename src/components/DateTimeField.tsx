"use client";

import { useEffect, useState } from "react";

const box = "min-h-12 rounded-xl border border-neutral-300 bg-transparent px-3 dark:border-neutral-700";
const pad = (v: string) => v.padStart(2, "0");

type Slot = { date: string; hour: string; minute: string };

function Field({ label, value, onChange }: { label: string; value: Slot; onChange: (s: Slot) => void }) {
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="mb-1 text-sm font-medium">{label}</legend>
      <div className="flex items-center gap-2">
        {/* Native calendar picker. Its dd/mm vs mm/dd order follows the device's region setting. */}
        <input
          type="date"
          lang="en-GB"
          required
          value={value.date}
          onChange={(e) => onChange({ ...value, date: e.target.value })}
          onClick={(e) => {
            try {
              e.currentTarget.showPicker();
            } catch {
              /* some browsers only open the picker from the icon */
            }
          }}
          aria-label={`${label}: date`}
          className={`${box} min-w-0 flex-1`}
        />
        <input
          inputMode="numeric"
          required
          maxLength={2}
          pattern="([01]?[0-9]|2[0-3])"
          placeholder="HH"
          value={value.hour}
          onChange={(e) => onChange({ ...value, hour: e.target.value.replace(/\D/g, "") })}
          aria-label={`${label}: hour (0-23)`}
          className={`${box} w-14 text-center`}
        />
        <span>:</span>
        <input
          inputMode="numeric"
          required
          maxLength={2}
          pattern="[0-5]?[0-9]"
          placeholder="MM"
          value={value.minute}
          onChange={(e) => onChange({ ...value, minute: e.target.value.replace(/\D/g, "") })}
          aria-label={`${label}: minutes (0-59)`}
          className={`${box} w-14 text-center`}
        />
      </div>
    </fieldset>
  );
}

const stamp = (s: Slot) => `${s.date}T${pad(s.hour)}:${pad(s.minute)}`;

// Start and end. Submits "startsAt" and "endsAt" as "YYYY-MM-DDTHH:MM" (read as Bangkok time on the server).
// If you move the start date past the end date, the end date follows.
export function EventTimes() {
  const [start, setStart] = useState<Slot>({ date: "", hour: "18", minute: "00" });
  const [end, setEnd] = useState<Slot>({ date: "", hour: "21", minute: "00" });

  // Today's date in the browser's timezone, set after load (the server's date may differ).
  useEffect(() => {
    const t = new Date();
    const today = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
    setStart((s) => ({ ...s, date: today }));
    setEnd((s) => ({ ...s, date: today }));
  }, []);

  const onStart = (s: Slot) => {
    setStart(s);
    if (s.date && end.date && end.date < s.date) setEnd({ ...end, date: s.date });
  };

  return (
    <>
      <Field label="Starts (Bangkok time)" value={start} onChange={onStart} />
      <Field label="Ends (Bangkok time)" value={end} onChange={setEnd} />
      <input type="hidden" name="startsAt" value={start.date ? stamp(start) : ""} />
      <input type="hidden" name="endsAt" value={end.date ? stamp(end) : ""} />
    </>
  );
}
