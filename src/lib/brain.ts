import type { LivingBrainClient as Client } from "@living-brain/sdk";
import { createHash } from "node:crypto";

// Living Brain = the app's memory of builders. All calls are server-side and optional:
// if the Brain is not configured, out of balance, or slow, callers fall back to the plain score.

const TIMEOUT = { timeoutInSeconds: 8, maxRetries: 0 } as const;

export type BrainUser = {
  id: string;
  name: string;
  githubLogin: string;
  stack: string[];
  topics: string[];
  tags: string[];
  meetPreference: string;
  workStatus: string | null;
  project?: { title: string; description: string } | null;
};

export function brainEnabled() {
  return !!(process.env.LIVING_BRAIN_API_KEY && process.env.LIVING_BRAIN_BRAIN_ID);
}

// Loaded on demand, so a missing or broken SDK can never take a page down.
async function client(): Promise<Client> {
  const { LivingBrainClient } = await import("@living-brain/sdk");
  return new LivingBrainClient({
    apiKey: process.env.LIVING_BRAIN_API_KEY!,
    // No subject id: the API key already identifies its owner (verified with scripts/brain-whoami.mjs).
    // The SDK types require the field, but it works left undefined.
    subjectId: undefined as unknown as string,
  });
}

const MEET: Record<string, string> = {
  in_person: "happy to meet in person",
  open: "open to meeting",
  chat_first: "prefers to chat online first",
};
const WORK: Record<string, string> = {
  employed: "employed",
  looking: "looking for a job",
  hiring: "hiring",
};

// The note the Brain learns from. The first line carries the name + login so the page can be traced back.
export function profileNote(u: BrainUser) {
  return [
    `Builder profile: ${u.name} (@${u.githubLogin})`,
    `Works with: ${u.stack.join(", ") || "not specified"}`,
    `Interested in: ${u.topics.join(", ") || "not specified"}`,
    u.tags.length ? `Tags: ${u.tags.join(", ")}` : null,
    u.project ? `Proudest project: ${u.project.title}${u.project.description ? ` - ${u.project.description}` : ""}` : null,
    `Meeting style: ${MEET[u.meetPreference] ?? u.meetPreference}`,
    u.workStatus ? `Work: ${WORK[u.workStatus] ?? u.workStatus}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

// One capture per profile version. The hash is part of originRef, so an unchanged profile is never re-sent.
export async function syncProfile(u: BrainUser) {
  if (!brainEnabled()) return false;
  const content = profileNote(u);
  const hash = createHash("sha1").update(content).digest("hex").slice(0, 8);
  try {
    await (await client()).captures.capture(
      {
        brainId: process.env.LIVING_BRAIN_BRAIN_ID!,
        body: { kind: "note", bucket: "notes", label: `Profile: ${u.name}`, content, originRef: `profile:${u.id}:${hash}` },
      },
      TIMEOUT,
    );
    return true;
  } catch (e) {
    console.error("brain sync failed:", e instanceof Error ? e.message : e);
    return false;
  }
}

// Memory of a made connection (accepted intros only; declines are never stored).
export async function recordConnection(a: BrainUser, b: BrainUser, eventTitle: string | null, requestId: string) {
  if (!brainEnabled()) return false;
  const content = `${a.name} (@${a.githubLogin}) and ${b.name} (@${b.githubLogin}) connected${
    eventTitle ? ` at ${eventTitle}` : ""
  }. Shared ground: ${a.stack.filter((s) => b.stack.map((x) => x.toLowerCase()).includes(s.toLowerCase())).join(", ") || "different stacks"}.`;
  try {
    await (await client()).captures.capture(
      { brainId: process.env.LIVING_BRAIN_BRAIN_ID!, body: { kind: "note", bucket: "notes", label: "Connection", content, originRef: `intro:${requestId}` } },
      TIMEOUT,
    );
    return true;
  } catch (e) {
    console.error("brain connection capture failed:", e instanceof Error ? e.message : e);
    return false;
  }
}

export type BrainPick = { similarity: number; why: string };

// Ask the Brain who is closest to me. Returns a map userId -> pick for people the Brain already knows,
// or null when the Brain is unavailable (the UI then explains and falls back).
export async function brainPicks(
  me: BrainUser,
  candidates: { id: string; name: string; githubLogin: string }[],
): Promise<Map<string, BrainPick> | null> {
  if (!brainEnabled()) return null;
  const query = `Which builders should this person meet? ${profileNote(me)}`;
  try {
    const results = await (await client()).workspace.searchPages(
      { brainId: process.env.LIVING_BRAIN_BRAIN_ID!, query, topK: 20, minSimilarity: 0.2 },
      TIMEOUT,
    );
    const picks = new Map<string, BrainPick>();
    for (const r of results) {
      if (r.status === "archived" || r.status === "deprecated") continue;
      const hay = `${r.title} ${r.summary} ${r.slug}`.toLowerCase();
      // Whole-word match on the login (so "al" never matches "alice"), or the full name.
      const word = (w: string) => new RegExp(`(^|[^a-z0-9-])${w.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^a-z0-9-])`).test(hay);
      const hit = candidates.find((c) => word(c.githubLogin) || hay.includes(c.name.toLowerCase()));
      if (!hit || picks.has(hit.id)) continue;
      picks.set(hit.id, { similarity: r.similarity, why: r.summary.replace(/\s+/g, " ").trim().slice(0, 220) });
    }
    return picks;
  } catch (e) {
    console.error("brain search failed:", e instanceof Error ? e.message : e);
    return null;
  }
}
