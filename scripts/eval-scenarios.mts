// Seeded evaluation scenarios: for every demo person at every demo event, run the same plain ranking + Brain re-rank
// the live feed uses, and log it, so the admin evaluation panel has repeatable "seeded scenario" evidence.
// Run order: npm run db:seed  ->  npm run brain:sync  (wait a minute or two)  ->  npm run eval:seed
// Safe to run again: it replaces the earlier seeded rows. Real users' logs are never touched.
import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, inArray } from "drizzle-orm";
import * as schema from "../src/db/schema.ts";
import { blendRanking } from "../src/lib/blend.ts";
import { brainEnabled, brainPicks } from "../src/lib/brain.ts";
import { scorePair, type MeetPreference, type WorkStatus } from "../src/lib/match.ts";

loadEnvConfig(process.cwd());
if (!brainEnabled()) throw new Error("Brain not configured. Run npm run brain:init first.");

const db = drizzle({ client: neon(process.env.DATABASE_URL!), schema });
const { users, events, attendances, rankingLogs } = schema;
const person = (u: typeof users.$inferSelect) => ({
  stack: u.stack, topics: u.topics, tags: u.tags,
  meetPreference: u.meetPreference as MeetPreference, workStatus: u.workStatus as WorkStatus,
});

const all = await db.select().from(users);
const demo = all.filter((u) => u.githubId.startsWith("demo-"));
if (demo.length === 0) throw new Error("No demo users. Run npm run db:seed first.");
await db.delete(rankingLogs).where(inArray(rankingLogs.userId, demo.map((u) => u.id)));

const evs = await db.select().from(events).where(inArray(events.slug, ["bangkok-ai-night-demo", "web3-builders-demo"]));
let logged = 0;
for (const ev of evs) {
  const att = await db.select({ userId: attendances.userId }).from(attendances).where(eq(attendances.eventId, ev.id));
  const ids = new Set(att.map((a) => a.userId));
  for (const me of demo.filter((u) => ids.has(u.id))) {
    const others = all.filter((u) => ids.has(u.id) && u.id !== me.id);
    if (others.length < 2) continue;
    const plain = others
      .map((u) => ({ user: u, match: scorePair(person(me), person(u)) }))
      .sort((a, b) => b.match.score - a.match.score);
    const t0 = Date.now();
    const picks = await brainPicks({ ...me, project: null }, plain.map((r) => ({ id: r.user.id, name: r.user.name, githubLogin: r.user.githubLogin })));
    const ms = Date.now() - t0;
    if (!picks || picks.size === 0) {
      console.log(`  ${me.name} @ ${ev.title}: the Brain returned nothing yet (profiles still compiling?) - skipped`);
      continue;
    }
    const { rows } = blendRanking(plain, picks, 8);
    await db.insert(rankingLogs).values(
      rows.map((r) => ({ userId: me.id, candidateId: r.candidateId, eventId: ev.id, plainRank: r.plainRank, finalRank: r.finalRank, brainSimilarity: r.similarity, brainMs: ms, reason: r.reason })),
    );
    logged += rows.length;
    console.log(`  ${me.name} @ ${ev.title}: ${rows.filter((r) => r.plainRank !== r.finalRank).length}/${rows.length} moved, Brain ${ms} ms`);
  }
}
console.log(`Logged ${logged} seeded ranking rows.`);
