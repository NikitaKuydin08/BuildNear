// The one formula that combines the plain score with the Brain's similarity. Pure (no database, no framework),
// so the live feed and the seeded evaluation scenarios always rank in exactly the same way.
export type BlendItem = { user: { id: string }; match: { score: number } };
export type BlendRow = { candidateId: string; plainRank: number; finalRank: number; similarity: number | null; reason: string };

// Final score = 60% plain score + 40% Brain similarity. People the Brain does not know yet keep their plain score.
export function blendRanking<T extends BlendItem>(plain: T[], picks: Map<string, { similarity: number }>, top = 8) {
  const head = plain.slice(0, top);
  const scored = head
    .map((r, i) => {
      const sim = picks.get(r.user.id)?.similarity;
      return { r, i, sim, final: sim === undefined ? r.match.score : 0.6 * r.match.score + 0.4 * sim * 100 };
    })
    .sort((a, b) => b.final - a.final || a.i - b.i);

  const list = scored.map((s, n) => ({
    ...s.r,
    brain: s.sim,
    note: s.i === n ? undefined : s.i > n ? `Brain moved them up ${s.i - n}` : `Brain moved them down ${n - s.i}`,
  }));
  const rows: BlendRow[] = scored.map((s, n) => ({
    candidateId: s.r.user.id,
    plainRank: s.i + 1,
    finalRank: n + 1,
    similarity: s.sim ?? null,
    reason: s.sim === undefined ? "Brain does not know this person yet" : list[n].note ?? "Brain kept the plain position",
  }));
  return { list: [...list, ...plain.slice(top)], rows };
}
