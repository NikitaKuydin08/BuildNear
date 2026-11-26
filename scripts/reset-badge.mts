// Testing helper: removes the recorded badge(s) of one user so the claim box appears again.
// (The on-chain token stays; this only clears the app's record.)
import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import * as schema from "../src/db/schema.ts";

loadEnvConfig(process.cwd());
const login = process.argv[2];
if (!login) throw new Error("Usage: npm run db:reset-badge -- <github-login>");

const db = drizzle({ client: neon(process.env.DATABASE_URL!), schema });
const [u] = await db.select().from(schema.users).where(eq(schema.users.githubLogin, login)).limit(1);
if (!u) throw new Error(`No user ${login}`);
const gone = await db.delete(schema.badges).where(eq(schema.badges.userId, u.id)).returning();
console.log(`Cleared ${gone.length} badge record(s) for ${login}.`);
