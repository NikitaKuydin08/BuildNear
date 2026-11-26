// Sends every user's profile to the Brain (one capture per changed profile). Demo users included, unless you pass --real-only.
import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import * as schema from "../src/db/schema.ts";
import { brainEnabled, syncProfile } from "../src/lib/brain.ts";

loadEnvConfig(process.cwd());
if (!brainEnabled()) throw new Error("Brain not configured. Run npm run brain:init first.");

const db = drizzle({ client: neon(process.env.DATABASE_URL!), schema });
const realOnly = process.argv.includes("--real-only");
const all = await db.select().from(schema.users);
// --real-only skips the fake demo people (github ids starting with "demo-").
const users = realOnly ? all.filter((u) => !u.githubId.startsWith("demo-")) : all;
const featured = await db.select().from(schema.projects).where(eq(schema.projects.featured, true));
let ok = 0;
for (const u of users) {
  const f = featured.find((p) => p.userId === u.id);
  if (await syncProfile({ ...u, project: f ? { title: f.title, description: f.description } : null })) ok++;
}
console.log(`Synced ${ok}/${users.length} profiles. The Brain compiles them in the background (a minute or two).`);
