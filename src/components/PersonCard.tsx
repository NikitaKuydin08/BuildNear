import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { Chips, Icon } from "@/components/ui";
import { FIELDS } from "@/lib/fields";
import type { MeetPreference } from "@/lib/match";

// The band at the top of the card (Figma 05: "OPEN TO A CONVERSATION") is the person's meeting preference.
export const MEET_BAND: Record<MeetPreference, string> = {
  in_person: "Happy to meet in person",
  open: "Open to a conversation",
  chat_first: "Chat first",
};
const WORK: Record<string, string> = { employed: "Employed", looking: "Looking for a job", hiring: "Hiring" };

export type PersonCardProps = {
  userId: string;
  photoAt?: Date | null;
  name: string;
  stack: string[];
  topics: string[];
  tags?: string[];
  meetPreference: MeetPreference;
  workStatus?: string | null;
  hereNow: boolean;
  why?: string;
  action?: "meet" | "chat";
  brainMatch?: number;
  rankNote?: string;
  project?: { title: string; description: string; url: string | null; visibility?: string } | null;
  distance?: string;
  // Small line under the topics, e.g. which events you share.
  note?: string;
};

// Contacts and the GitHub link are intentionally not shown here: they are revealed on an accepted introduction.
export function PersonCard(p: PersonCardProps) {
  const curious = [...p.topics.map((t) => FIELDS.find((f) => f.key === t)?.label ?? t), ...(p.tags ?? [])];
  const sub = [p.workStatus ? WORK[p.workStatus] : null, p.distance].filter(Boolean).join(" · ");
  return (
    <article className="overflow-hidden rounded-[22px] bg-card">
      <div className="flex h-20 items-start justify-between gap-2 bg-lavender px-5 pt-5">
        <p className="text-[10px] font-semibold uppercase tracking-[1.2px] text-purple">{MEET_BAND[p.meetPreference]}</p>
        <div className="flex gap-1.5">
          {p.brainMatch !== undefined && (
            <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-semibold text-ink">Brain {Math.round(p.brainMatch * 100)}%</span>
          )}
          {p.hereNow && (
            <span className="flex items-center gap-1 rounded-full bg-card px-2 py-0.5 text-[10px] font-semibold text-ink">
              <span className="size-1.5 rounded-full bg-[#3DAA4F]" />
              Here now
            </span>
          )}
        </div>
      </div>
      <div className="px-5 pb-5">
        <div className="-mt-6">
          <Avatar userId={p.userId} name={p.name} photoAt={p.photoAt} size={76} />
        </div>
        <Link href={`/people/${p.userId}`} className="mt-4 block text-[24px] font-semibold leading-[30px] tracking-[-0.4px] text-ink">
          {p.name}
        </Link>
        {sub && <p className="mt-1 text-[13px] text-muted">{sub}</p>}

        {p.stack.length > 0 && (
          <>
            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[1.1px] text-muted">Builds with · From GitHub</p>
            <div className="mt-2.5">
              <Chips items={p.stack} />
            </div>
          </>
        )}
        {curious.length > 0 && (
          <>
            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[1.1px] text-muted">Curious about</p>
            <div className="mt-2.5">
              <Chips items={curious} tone="lilac" max={5} />
            </div>
          </>
        )}

        {p.project && (
          <div className="mt-5 flex gap-3 rounded-[14px] border border-line p-3.5">
            <span className="mt-0.5 text-muted">
              <Icon name={p.project.visibility === "private" ? "lock" : "folder"} size={20} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[1.1px] text-muted">Proudest project{p.project.visibility === "private" ? " · private" : ""}</p>
              <p className="mt-1 text-[14px] font-semibold">{p.project.title}</p>
              {p.project.description && <p className="text-[12px] leading-[17px] text-muted">{p.project.description}</p>}
              {p.project.url && (
                <a href={p.project.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-[12px] font-medium text-purple">
                  Open link <Icon name="external" size={12} />
                </a>
              )}
            </div>
          </div>
        )}

        {p.note && <p className="mt-4 text-[12px] text-muted">{p.note}</p>}

        {p.why && (
          <div className="mt-4 rounded-[14px] bg-lilac p-3.5">
            <p className="flex items-center gap-1 text-[12px] font-semibold text-purple">
              <Icon name="spark" size={14} />
              {p.action === "chat" ? "Chat first" : p.action === "meet" ? "Worth meeting" : "Why you might click"}
            </p>
            <p className="mt-1 text-[13px] leading-[19px] text-ink">{p.why}</p>
            {p.rankNote && <p className="mt-1 text-[11px] text-muted">{p.rankNote}</p>}
          </div>
        )}
      </div>
    </article>
  );
}
