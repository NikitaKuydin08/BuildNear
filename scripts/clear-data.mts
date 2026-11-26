// Clears test data so you can start a clean run on your phone.
//   npm run db:clear         removes the DEMO data only (fake people, "-demo" events, and everything linked to them).
//                            Your real account stays, and so do your own profile and projects.
//   npm run db:clear -- --all   removes EVERYTHING, including real accounts (they sign in again and get fresh profiles).
// The blockchain keeps any badges already minted; this only clears the database.
import nextEnv from "@next/env";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { like } from "drizzle-orm";
import * as schema from "../src/db/schema.ts";

nextEnv.loadEnvConfig(process.cwd());
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set (check .env.local)");
const db = drizzle({ client: neon(url), schema });
const all = process.argv.includes("--all");

const count = async (t: any) => (await db.select().from(t)).length;
const before = { users: await count(schema.users), events: await count(schema.events), intros: await count(schema.introRequests) };

if (all) {
  // Cascades remove attendances, intro requests, badge records and projects.
  await db.delete(schema.users);
  await db.delete(schema.events);
} else {
  await db.delete(schema.users).where(like(schema.users.githubId, "demo-%"));
  await db.delete(schema.events).where(like(schema.events.slug, "%-demo"));
  // Any intro requests / check-ins / badge records linked to those cascade away with them.
}

const after = { users: await count(schema.users), events: await count(schema.events), intros: await count(schema.introRequests) };
console.log(all ? "Cleared EVERYTHING." : "Cleared demo data.");
console.log("before:", before);
console.log("after: ", after);
