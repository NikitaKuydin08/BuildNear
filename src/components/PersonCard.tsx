import type { MeetPreference } from "@/lib/match";

const MEET_LABEL: Record<MeetPreference, string> = {
  in_person: "Happy to meet in person",
  open: "Open to meeting",
  chat_first: "Chat first",
};

export type PersonCardProps = {
  name: string;
  stack: string[];
  topics: string[];
  meetPreference: MeetPreference;
  hereNow: boolean;
  why?: string;
  action?: "meet" | "chat";
  brainMatch?: number;
  children?: React.ReactNode;
};

// Contacts and the GitHub link are intentionally not shown here: they are revealed on an approved intro.
export function PersonCard(p: PersonCardProps) {
  return (
    <li className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="flex items-center gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-lg font-semibold dark:bg-neutral-800">
          {p.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{p.name}</p>
          <p className="text-xs text-neutral-500">{MEET_LABEL[p.meetPreference]}</p>
        </div>
        {p.brainMatch !== undefined && (
          <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
            Brain {Math.round(p.brainMatch * 100)}%
          </span>
        )}
        {p.hereNow && (
          <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/40 dark:text-green-300">
            Here now
          </span>
        )}
      </div>

      {p.stack.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {p.stack.slice(0, 5).map((s) => (
            <span key={s} className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs dark:bg-neutral-800">
              {s}
            </span>
          ))}
        </div>
      )}
      {p.topics.length > 0 && (
        <p className="mt-2 text-xs text-neutral-500">Into: {p.topics.slice(0, 4).join(", ")}</p>
      )}

      {p.why && (
        <p className="mt-3 rounded-xl bg-neutral-50 p-3 text-sm dark:bg-neutral-900">
          {p.action && <span className="font-medium">{p.action === "chat" ? "Chat first. " : "Worth meeting. "}</span>}
          {p.why}
        </p>
      )}

      {p.children}
    </li>
  );
}
