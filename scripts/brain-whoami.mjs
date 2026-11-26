// Checks which subject ID your API key can act for (read-only, changes nothing).
//   node scripts/brain-whoami.mjs <candidate-subject-id> [<another> ...]
//   node scripts/brain-whoami.mjs none      (tries without any subject id: the key may already know its owner)
import fs from "node:fs";
import { LivingBrainClient } from "@living-brain/sdk";

const env = fs.readFileSync(".env.local", "utf8");
const apiKey = env.match(/^LIVING_BRAIN_API_KEY=(.*)$/m)?.[1]?.trim();
if (!apiKey) throw new Error("Put LIVING_BRAIN_API_KEY in .env.local first.");
const ids = process.argv.slice(2);
if (ids.length === 0) throw new Error("Pass at least one candidate subject id.");

for (const id of ids) {
  try {
    const client = new LivingBrainClient(id === "none" ? { apiKey, subjectId: undefined } : { apiKey, subjectId: id });
    const brains = await client.brains.list();
    console.log(`WORKS  ${id}  (${brains.length} brain(s): ${brains.map((b) => b.name).join(", ") || "none"})`);
  } catch (e) {
    console.log(`NO     ${id}  ->`, e.statusCode, e.body?.message ?? e.message);
  }
}
