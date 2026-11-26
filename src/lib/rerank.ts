import { brainEnabled, brainPicks, type BrainUser } from "@/lib/brain";

type Item = { user: { id: string; name: string; githubLogin: string }; match: { score: number } };
export type Reranked<T> = T & { brain?: number; note?: string };

// Takes the plain ranking (best first) and lets the Living Brain re-rank the top few.
// Final score = 60% plain score + 40% Brain similarity (people the Brain doesn't know yet keep their plain score).
// If the Brain is off or unreachable, the plain ranking is returned untouched, so the page never breaks.
export async function rerankWithBrain<T extends Item>(me: BrainUser, plain: T[], top = 8): Promise<{ list: Reranked<T>[]; used: boolean }> {
  if (!brainEnabled() || plain.length < 2) return { list: plain, used: false };
  const head = plain.slice(0, top);
  const picks = await brainPicks(me, head.map((r) => ({ id: r.user.id, name: r.user.name, githubLogin: r.user.githubLogin })));
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
  return { list: [...list, ...plain.slice(top)], used: true };
}
