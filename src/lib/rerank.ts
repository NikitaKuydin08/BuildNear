import { after } from "next/server";
import { getDb } from "@/db";
import { rankingLogs } from "@/db/schema";
import { brainEnabled, brainPicks, type BrainUser } from "@/lib/brain";

type Item = { user: { id: string; name: string; githubLogin: string }; match: { score: number } };
export type Reranked<T> = T & { brain?: number; note?: string };

// Takes the plain ranking (best first) and lets the Living Brain re-rank the top few.
// Final score = 60% plain score + 40% Brain similarity (people the Brain doesn't know yet keep their plain score).
// If the Brain is off or unreachable, the plain ranking is returned untouched, so the page never breaks.
// With `ctx`, every re-rank is logged (plain rank, final rank, Brain latency) for the admin evaluation panel.
export async function rerankWithBrain<T extends Item>(
  me: BrainUser,
  plain: T[],
  top = 8,
  ctx?: { eventId: string },
): Promise<{ list: Reranked<T>[]; used: boolean }> {
  if (!brainEnabled() || plain.length < 2) return { list: plain, used: false };
  const head = plain.slice(0, top);
  const started = Date.now();
  const picks = await brainPicks(me, head.map((r) => ({ id: r.user.id, name: r.user.name, githubLogin: r.user.githubLogin })));
  const brainMs = Date.now() - started;
  if (!picks || picks.size === 0) return { list: plain, used: false };

  const scored = head
    .map((r, i) => {
      const sim = picks.get(r.user.id)?.similarity;
      return { r, i, sim, final: sim === undefined ? r.match.score : 0.6 * r.match.score + 0.4 * sim * 100 };
    })
    .sort((a, b) => b.final - a.final || a.i - b.i);

  const list: Reranked<T>[] = scored.map((s, n) => ({
    ...s.r,
    brain: s.sim,
    note: s.i === n ? undefined : s.i > n ? `Brain moved them up ${s.i - n}` : `Brain moved them down ${n - s.i}`,
  }));

  if (ctx) {
    const rows = scored.map((s, n) => ({
      userId: me.id,
      candidateId: s.r.user.id,
      eventId: ctx.eventId,
      plainRank: s.i + 1,
      finalRank: n + 1,
      brainSimilarity: s.sim ?? null,
      brainMs,
      reason: s.sim === undefined ? "Brain does not know this person yet" : list[n].note ?? "Brain kept the plain position",
    }));
    // After the response is sent, and never allowed to break the feed.
    try {
      after(async () => {
        try {
          await getDb().insert(rankingLogs).values(rows);
        } catch (e) {
          console.error("ranking log failed:", e instanceof Error ? e.message : e);
        }
      });
    } catch {}
  }
  return { list: [...list, ...plain.slice(top)], used: true };
}
