import { after } from "next/server";
import { getDb } from "@/db";
import { rankingLogs } from "@/db/schema";
import { blendRanking } from "@/lib/blend";
import { brainEnabled, brainPicks, type BrainUser } from "@/lib/brain";

type Item = { user: { id: string; name: string; githubLogin: string }; match: { score: number } };
export type Reranked<T> = T & { brain?: number; note?: string };

// Takes the plain ranking (best first) and lets the Living Brain re-rank the top few (formula: src/lib/blend.ts).
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

  const { list, rows } = blendRanking(plain, picks, top);

  if (ctx) {
    const values = rows.map((r) => ({
      userId: me.id,
      candidateId: r.candidateId,
      eventId: ctx.eventId,
      plainRank: r.plainRank,
      finalRank: r.finalRank,
      brainSimilarity: r.similarity,
      brainMs,
      reason: r.reason,
    }));
    // After the response is sent, and never allowed to break the feed.
    try {
      after(async () => {
        try {
          await getDb().insert(rankingLogs).values(values);
        } catch (e) {
          console.error("ranking log failed:", e instanceof Error ? e.message : e);
        }
      });
    } catch {}
  }
  return { list: list as Reranked<T>[], used: true };
}
