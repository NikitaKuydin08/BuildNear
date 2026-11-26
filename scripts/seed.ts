// Demo data only: fictional people, no real accounts. Safe to run more than once.
import { loadEnvConfig } from "@next/env";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { and, eq, inArray } from "drizzle-orm";
import * as schema from "../src/db/schema";

loadEnvConfig(process.cwd());

const DAY = 24 * 60 * 60 * 1000;

const demoUsers = [
  { n: 1, login: "demo-anna", name: "Anna Petrova", stack: ["TypeScript", "React"], topics: ["web3", "ai"], tags: ["frontend", "hackathons"], meet: "in_person", work: "looking" },
  { n: 2, login: "demo-ben", name: "Ben Sato", stack: ["C++", "Rust"], topics: ["networking", "systems"], tags: ["backend"], meet: "open", work: "employed" },
  { n: 3, login: "demo-chai", name: "Chai Wong", stack: ["Python", "SQL"], topics: ["ai", "data"], tags: ["ml", "data-analysis"], meet: "chat_first", work: "hiring" },
  { n: 4, login: "demo-dara", name: "Dara Lim", stack: ["Solidity", "TypeScript"], topics: ["web3", "defi"], tags: ["smart-contracts"], meet: "in_person", work: "employed" },
  { n: 5, login: "demo-eli", name: "Eli Novak", stack: ["Go", "Docker"], topics: ["infrastructure", "sustainability"], tags: ["devops"], meet: "open", work: null },
  { n: 6, login: "demo-fern", name: "Fern Aree", stack: ["Python", "TypeScript"], topics: ["ai", "sustainability"], tags: ["data", "climate"], meet: "in_person", work: "looking" },
  { n: 7, login: "demo-gus", name: "Gus Mehta", stack: ["Swift", "Kotlin"], topics: ["mobile", "ux"], tags: ["apps"], meet: "chat_first", work: "employed" },
  { n: 8, login: "demo-hana", name: "Hana Kim", stack: ["C++", "Python"], topics: ["ai", "robotics"], tags: ["ml", "embedded"], meet: "open", work: "looking" },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set (check .env.local)");
  const db = drizzle({ client: neon(url), schema });
  const { users, events, attendances } = schema;
  const now = Date.now();

  await db
    .insert(users)
    .values(
      demoUsers.map((u) => ({
        githubId: `demo-${u.n}`,
        githubLogin: u.login,
        name: u.name,
        stack: u.stack,
        topics: u.topics,
        tags: u.tags,
        meetPreference: u.meet,
        workStatus: u.work,
      })),
    )
    .onConflictDoNothing();

  await db
    .insert(events)
    .values([
      {
        slug: "bangkok-ai-night-demo",
        title: "Bangkok AI Night (demo)",
        venue: "Co-working space, Sukhumvit",
        startsAt: new Date(now - DAY),
        endsAt: new Date(now + 60 * DAY),
        checkInCode: "AINIGHT",
      },
      {
        slug: "web3-builders-demo",
        title: "Web3 Builders Meetup (demo)",
        venue: "Cafe, Silom",
        startsAt: new Date(now - DAY),
        endsAt: new Date(now + 60 * DAY),
        checkInCode: "WEB3BKK",
      },
    ])
    .onConflictDoNothing();

  const dbUsers = await db.select().from(users).where(inArray(users.githubId, demoUsers.map((u) => `demo-${u.n}`)));
  const dbEvents = await db.select().from(events).where(inArray(events.slug, ["bangkok-ai-night-demo", "web3-builders-demo"]));
  const uid = (n: number) => dbUsers.find((u) => u.githubId === `demo-${n}`)!.id;
  const eid = (slug: string) => dbEvents.find((e) => e.slug === slug)!.id;

  const plan: { slug: string; joined: number[]; here: number[] }[] = [
    { slug: "bangkok-ai-night-demo", joined: [1, 2, 3, 6, 8], here: [3, 6] },
    { slug: "web3-builders-demo", joined: [1, 2, 4], here: [4] },
  ];

  for (const p of plan) {
    await db
      .insert(attendances)
      .values(p.joined.map((n) => ({ userId: uid(n), eventId: eid(p.slug) })))
      .onConflictDoNothing();
    for (const n of p.here) {
      await db
        .update(attendances)
        .set({ checkedInAt: new Date() })
        .where(and(eq(attendances.userId, uid(n)), eq(attendances.eventId, eid(p.slug))));
    }
  }

  console.log("Seeded 8 demo users, 2 demo events. Check-in codes: AINIGHT, WEB3BKK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
