import { Suspense } from "react";
import Link from "next/link";
import { alias } from "drizzle-orm/pg-core";
import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { events, rankingLogs, users } from "@/db/schema";
import { requireAdmin } from "@/lib/organizer";

const fmt = (d: Date) => d.toLocaleString("en-GB", { timeZone: "Asia/Bangkok", dateStyle: "short", timeStyle: "medium" });

// Admin only (404 for everyone else). Evidence for sponsors: what the Living Brain changed compared with the plain ranking.
async function EvaluationView() {
  await requireAdmin("/admin/evaluation");
  const db = getDb();
  const viewer = alias(users, "viewer");
  const candidate = alias(users, "candidate");

  const [sum] = await db
    .select({
      total: sql<number>`count(*)::int`,
      moved: sql<number>`count(*) filter (where ${rankingLogs.plainRank} <> ${rankingLogs.finalRank})::int`,
      movedUp: sql<number>`count(*) filter (where ${rankingLogs.finalRank} < ${rankingLogs.plainRank})::int`,
      avgMs: sql<number>`coalesce(round(avg(${rankingLogs.brainMs}))::int, 0)`,
      maxMs: sql<number>`coalesce(max(${rankingLogs.brainMs}), 0)::int`,
      lists: sql<number>`count(distinct (${rankingLogs.userId}, ${rankingLogs.createdAt}))::int`,
    })
    .from(rankingLogs);

  const rows = await db
    .select({ log: rankingLogs, viewer: viewer.name, candidate: candidate.name, event: events.title })
    .from(rankingLogs)
    .innerJoin(viewer, eq(rankingLogs.userId, viewer.id))
    .innerJoin(candidate, eq(rankingLogs.candidateId, candidate.id))
    .leftJoin(events, eq(rankingLogs.eventId, events.id))
    .orderBy(desc(rankingLogs.createdAt), rankingLogs.finalRank)
    .limit(80);

  const stat = (label: string, value: string | number) => (
    <div className="rounded-2xl border border-neutral-200 p-3 dark:border-neutral-800">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
  const pct = sum.total ? Math.round((sum.moved / sum.total) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-neutral-500">
        Each time the Brain re-ranks someone&apos;s &quot;For you&quot; feed, it is logged here: position in the plain ranking, position after the Brain, and how long the Brain took.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {stat("Feeds re-ranked", sum.lists)}
        {stat("People ranked", sum.total)}
        {stat("Moved by the Brain", `${sum.moved} (${pct}%)`)}
        {stat("Moved up", sum.movedUp)}
        {stat("Brain time, average", `${sum.avgMs} ms`)}
        {stat("Brain time, slowest", `${sum.maxMs} ms`)}
      </div>

      {rows.length === 0 ? (
        <p className="text-neutral-500">Nothing logged yet. Open the &quot;For you&quot; tab at an event with at least two other people checked in.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="py-2 pr-3">Time</th>
                <th className="pr-3">For</th>
                <th className="pr-3">Person</th>
                <th className="pr-3">Plain</th>
                <th className="pr-3">Final</th>
                <th className="pr-3">Move</th>
                <th className="pr-3">Brain</th>
                <th className="pr-3">ms</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ log, viewer: v, candidate: c, event }) => {
                const delta = log.plainRank - log.finalRank;
                return (
                  <tr key={log.id} className="border-t border-neutral-200 dark:border-neutral-800" title={`${event ?? ""} · ${log.reason}`}>
                    <td className="py-2 pr-3 whitespace-nowrap text-xs text-neutral-500">{fmt(log.createdAt)}</td>
                    <td className="pr-3">{v}</td>
                    <td className="pr-3">{c}</td>
                    <td className="pr-3">#{log.plainRank}</td>
                    <td className="pr-3">#{log.finalRank}</td>
                    <td className={`pr-3 font-medium ${delta > 0 ? "text-green-600" : delta < 0 ? "text-red-600" : "text-neutral-400"}`}>
                      {delta > 0 ? `↑${delta}` : delta < 0 ? `↓${-delta}` : "–"}
                    </td>
                    <td className="pr-3">{log.brainSimilarity === null ? "unknown" : `${Math.round(log.brainSimilarity * 100)}%`}</td>
                    <td className="pr-3">{log.brainMs}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Link href="/admin/events" className="text-sm underline">← Organizer: events</Link>
    </div>
  );
}

export default function EvaluationPage() {
  return (
    <main className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">Organizer: Brain evaluation</h1>
      <Suspense fallback={<p className="text-neutral-400">Loading…</p>}>
        <EvaluationView />
      </Suspense>
    </main>
  );
}
