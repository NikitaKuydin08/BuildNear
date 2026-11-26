import { scorePair, type Person } from "../src/lib/match.ts";

const me: Person = { stack: ["TypeScript", "React"], topics: ["web3", "ai"], tags: [], meetPreference: "in_person", workStatus: "looking" };
const mk = (o: Partial<Person>): Person => ({ stack: [], topics: [], tags: [], meetPreference: "open", workStatus: null, ...o });

const cases: [string, Person, string][] = [
  ["peers", mk({ stack: ["typescript"], topics: ["AI"] }), "peers"],
  ["complementary", mk({ stack: ["Solidity"], topics: ["web3"], meetPreference: "in_person" }), "complementary"],
  ["cross_domain", mk({ stack: ["React"], topics: ["mobile"] }), "cross_domain"],
  ["low", mk({ stack: ["Go"], topics: ["devops"] }), "low"],
];
let failed = 0;
for (const [name, other, expected] of cases) {
  const r = scorePair(me, other);
  const ok = r.relationship === expected;
  if (!ok) failed++;
  console.log(ok ? "PASS" : "FAIL", name, r.relationship, r.score, r.action, "|", r.why);
}
const comp = scorePair(me, mk({ stack: ["Solidity"], topics: ["web3"], meetPreference: "in_person" }));
const compChat = scorePair(me, mk({ stack: ["Solidity"], topics: ["web3"], meetPreference: "chat_first" }));
const hire = scorePair(me, mk({ stack: ["Go"], topics: ["devops"], workStatus: "hiring" }));
const low = scorePair(me, mk({ stack: ["Go"], topics: ["devops"] }));
const checks: [string, boolean][] = [
  ["chat_first ranks below the same match open to meeting", compChat.score < comp.score],
  ["chat_first is lowered, not excluded (score > 0)", compChat.score > 0],
  ["chat_first suggests chat", compChat.action === "chat"],
  ["looking + hiring gets a bonus", hire.score > low.score],
  ["scores stay within 0-100", [comp, compChat, hire, low].every((r) => r.score >= 0 && r.score <= 100)],
];
for (const [name, ok] of checks) { if (!ok) failed++; console.log(ok ? "PASS" : "FAIL", name); }
console.log(failed === 0 ? "ALL PASSED" : `${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
