import { Suspense } from "react";
import Link from "next/link";
import { alias } from "drizzle-orm/pg-core";
import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { events, introRequests, rankingLogs, users } from "@/db/schema";
import { requireAdmin } from "@/lib/organizer";

const fmt = (d: Date) => d.toLocaleString("en-GB", { timeZone: "Asia/Bangkok", dateStyle: "short", timeStyle: "medium" });
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "–");

type Group = { label: string; sent: number; answered: number; accepted: number };

// Admin only (404 for everyone else). Evidence for sponsors: what the Living Brain changed compared with the plain ranking.
async function EvaluationView() {
  await requireAdmin("/admin/evaluation");
  const db = getDb();
  const viewer = alias(users, "viewer");
  const candidate = alias(users, "candidate");

  // Ranking stats, split into real people and seeded scenarios (demo users, github ids "demo-...").
  const seededExpr = sql<boolean>`${viewer.githubId} like 'demo-%'`;
  const stats = await db
    .select({
      seeded: seededExpr,
      total: sql<number>`count(*)::int`,
      moved: sql<number>`count(*) filter (where ${rankingLogs.plainRank} <> ${rankingLogs.finalRank})::int`,
      movedUp: sql<number>`count(*) filter (where ${rankingLogs.finalRank} < ${rankingLogs.plainRank})::int`,
      avgMs: sql<number>`coalesce(round(avg(${rankingLogs.brainMs}))::int, 0)`,
      maxMs: sql<number>`coalesce(max(${rankingLogs.brainMs}), 0)::int`,
    })
    .from(rankingLogs)
    .innerJoin(viewer, eq(rankingLogs.userId, viewer.id))
    .groupBy(seededExpr);
  const real = stats.find((s) => !s.seeded) ?? { total: 0, moved: 0, movedUp: 0, avgMs: 0, maxMs: 0 };
  const seeded = stats.find((s) => s.seeded) ?? { total: 0, moved: 0, movedUp: 0, avgMs: 0, maxMs: 0 };

  const rows = await db
    .select({ log: rankingLogs, viewer: viewer.name, viewerSeeded: seededExpr, candidate: candidate.name, event: events.title })
    .from(rankingLogs)
    .innerJoin(viewer, eq(rankingLogs.userId, viewer.id))
    .innerJoin(candidate, eq(rankingLogs.candidateId, candidate.id))
    .leftJoin(events, eq(rankingLogs.eventId, events.id))
    .orderBy(desc(rankingLogs.createdAt), rankingLogs.finalRank)
    .limit(80);

  // Intro requests: totals, and the acceptance rate split by what the Brain did to that person's position for the sender.
  const intros = await db.select({ from: introRequests.fromUserId, to: introRequests.toUserId, status: introRequests.status }).from(introRequests);
  const seen = await db
    .select({
      u: rankingLogs.userId,
      c: rankingLogs.candidateId,
      up: sql<boolean>`bool_or(${rankingLogs.plainRank} > ${rankingLogs.finalRank})`,
    })
    .from(rankingLogs)
    .groupBy(rankingLogs.userId, rankingLogs.candidateId);
  const seenBy = new Map(seen.map((s) => [`${s.u}:${s.c}`, s.up]));
  const groups: Group[] = [
    { label: "To people the Brain moved up", sent: 0, answered: 0, accepted: 0 },
    { label: "To people it ranked but did not move up", sent: 0, answered: 0, accepted: 0 },
    { label: "To people with no Brain ranking logged", sent: 0, answered: 0, accepted: 0 },
  ];
  for (const i of intros) {
    const up = seenBy.get(`${i.from}:${i.to}`);
    const g = groups[up === undefined ? 2 : up ? 0 : 1];
    g.sent++;
    if (i.status !== "pending") g.answered++;
    if (i.status === "accepted") g.accepted++;
  }
  const totalSent = intros.length;
  const totalAnswered = intros.filter((i) => i.status !== "pending").length;
  const totalAccepted = intros.filter((i) => i.status === "accepted").length;

  const card = "rounded-[18px] bg-card p-3";
  const stat = (label: string, value: string | number) => (
    <div className={card}>
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
  const block = (title: string, s: typeof real, note: string) => (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="font-medium">{title}</h2>
        <p className="text-xs text-muted">{note}</p>
      </div>
      {s.total === 0 ? (
        <p className="text-sm text-muted">Nothing logged yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {stat("People ranked", s.total)}
          {stat("Moved by the Brain", `${s.moved} (${pct(s.moved, s.total)})`)}
          {stat("Moved up", s.movedUp)}
          {stat("Brain time, avg / slowest", `${s.avgMs} / ${s.maxMs} ms`)}
        </div>
      )}
    </section>
  );

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted">
        Each time the Brain re-ranks someone&apos;s &quot;For you&quot; feed, it is logged here: position in the plain ranking, position after the Brain, and how long the Brain took.
      </p>

      {block("Real users", real, "Live feeds opened by signed-in people.")}
      {block("Seeded scenarios", seeded, "Repeatable runs for the demo people (npm run eval:seed). Same formula as the live feed.")}

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="font-medium">Intro requests</h2>
          <p className="text-xs text-muted">
            {totalSent} sent · {totalAnswered} answered · {totalAccepted} accepted ({pct(totalAccepted, totalAnswered)} of answered). Rates are only a hint with a small sample: n is shown.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted">
              <tr><th className="py-2 pr-3">Group</th><th className="pr-3">Sent</th><th className="pr-3">Answered</th><th className="pr-3">Accepted</th><th className="pr-3">Rate</th></tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <tr key={g.label} className="border-t border-neutral-200">
                  <td className="py-2 pr-3">{g.label}</td>
                  <td className="pr-3">{g.sent}</td>
                  <td className="pr-3">{g.answered}</td>
                  <td className="pr-3">{g.accepted}</td>
                  <td className="pr-3 font-medium">{pct(g.accepted, g.answered)} <span className="text-xs font-normal text-muted">(n={g.answered})</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-medium">Latest rankings</h2>
        {rows.length === 0 ? (
          <p className="text-muted">Nothing logged yet. Open the &quot;For you&quot; tab at an event with at least two other people, or run npm run eval:seed.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="py-2 pr-3">Time</th><th className="pr-3">For</th><th className="pr-3">Person</th>
                  <th className="pr-3">Plain</th><th className="pr-3">Final</th><th className="pr-3">Move</th><th className="pr-3">Brain</th><th className="pr-3">ms</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ log, viewer: v, viewerSeeded, candidate: c, event }) => {
                  const delta = log.plainRank - log.finalRank;
                  return (
                    <tr key={log.id} className="border-t border-neutral-200" title={`${event ?? ""} · ${log.reason}`}>
                      <td className="py-2 pr-3 whitespace-nowrap text-xs text-muted">{fmt(log.createdAt)}</td>
                      <td className="pr-3">{v}{viewerSeeded && <span className="ml-1 text-xs text-muted">(seeded)</span>}</td>
                      <td className="pr-3">{c}</td>
                      <td className="pr-3">#{log.plainRank}</td>
                      <td className="pr-3">#{log.finalRank}</td>
                      <td className={`pr-3 font-medium ${delta > 0 ? "text-green-600" : delta < 0 ? "text-red-600" : "text-muted"}`}>
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
      </section>
      <Link href="/admin/events" className="text-sm underline">← Organizer: events</Link>
    </div>
  );
}

export default function EvaluationPage() {
  return (
    <main className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">Organizer: Brain evaluation</h1>
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <EvaluationView />
      </Suspense>
    </main>
  );
}
