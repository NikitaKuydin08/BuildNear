// Demo helper: gives YOUR account one pending and one accepted intro from fictional people.
// Usage: npm run db:seed-intro -- <your-github-login>
import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import * as schema from "../src/db/schema.ts";

loadEnvConfig(process.cwd());
const login = process.argv[2];
if (!login) throw new Error("Pass your GitHub login: npm run db:seed-intro -- <login>");

const db = drizzle({ client: neon(process.env.DATABASE_URL!), schema });
const [me] = await db.select().from(schema.users).where(eq(schema.users.githubLogin, login)).limit(1);
if (!me) throw new Error(`No user ${login}. Sign in once first.`);

const pick = async (l: string) => (await db.select().from(schema.users).where(eq(schema.users.githubLogin, l)).limit(1))[0];
const anna = await pick("demo-anna");
const dara = await pick("demo-dara");
if (!anna || !dara) throw new Error("Run npm run db:seed first.");

await db.insert(schema.introRequests).values([
  { fromUserId: anna.id, toUserId: me.id, message: "Saw your stack, want to compare notes on the hackathon?", status: "pending" },
  { fromUserId: dara.id, toUserId: me.id, message: "Working on a BSC contract, happy to chat.", status: "accepted", respondedAt: new Date() },
]).onConflictDoNothing();
console.log("Done: open /inbox");
