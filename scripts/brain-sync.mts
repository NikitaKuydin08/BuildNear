// Sends every user's profile to the Brain (one capture per changed profile). Demo users included.
import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/db/schema.ts";
import { brainEnabled, syncProfile } from "../src/lib/brain.ts";

loadEnvConfig(process.cwd());
if (!brainEnabled()) throw new Error("Brain not configured. Run npm run brain:init first.");

const db = drizzle({ client: neon(process.env.DATABASE_URL!), schema });
const users = await db.select().from(schema.users);
let ok = 0;
for (const u of users) {
  if (await syncProfile(u)) ok++;
}
console.log(`Synced ${ok}/${users.length} profiles. The Brain compiles them in the background (a minute or two).`);
