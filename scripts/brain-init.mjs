// Creates the app's own Brain (separate from your dev notes) and saves the ids to .env.local.
// Needs LIVING_BRAIN_API_KEY (lbk_...) in .env.local first.
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { LivingBrainClient } from "@living-brain/sdk";

let env = fs.readFileSync(".env.local", "utf8");
const get = (k) => env.match(new RegExp(`^${k}=(.*)$`, "m"))?.[1]?.trim();
const set = (k, v) => {
  env = new RegExp(`^${k}=`, "m").test(env) ? env.replace(new RegExp(`^${k}=.*$`, "m"), `${k}=${v}`) : env + `${env.endsWith("\n") ? "" : "\n"}${k}=${v}\n`;
};

const apiKey = get("LIVING_BRAIN_API_KEY");
if (!apiKey) throw new Error("Put your LIVING_BRAIN_API_KEY in .env.local first.");
if (get("LIVING_BRAIN_BRAIN_ID") && get("LIVING_BRAIN_SUBJECT_ID")) {
  console.log("Brain already configured in .env.local.");
  process.exit(0);
}

const subjectId = get("LIVING_BRAIN_SUBJECT_ID") || randomUUID();
const client = new LivingBrainClient({ apiKey, subjectId });
const brain = await client.brains.create({ name: "Builders (app)", description: "Profiles and connections of builders at events." });
set("LIVING_BRAIN_SUBJECT_ID", subjectId);
set("LIVING_BRAIN_BRAIN_ID", brain.id);
fs.writeFileSync(".env.local", env, { mode: 0o600 });
console.log("Brain created. Saved LIVING_BRAIN_SUBJECT_ID and LIVING_BRAIN_BRAIN_ID to .env.local.");
