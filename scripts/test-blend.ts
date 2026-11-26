// Checks the plain + Brain blend (src/lib/blend.ts) on a small known case.
import { blendRanking } from "../src/lib/blend.ts";

const mk = (id: string, score: number) => ({ user: { id }, match: { score } });
const plain = [mk("a", 80), mk("b", 70), mk("c", 60), mk("d", 50)];
const picks = new Map([["c", { similarity: 1 }], ["a", { similarity: 0 }]]); // c: perfect Brain match, a: none, b and d: unknown
const { list, rows } = blendRanking(plain, picks, 8);

let failed = 0;
const check = (name: string, ok: boolean) => { console.log(`${ok ? "PASS" : "FAIL"} ${name}`); if (!ok) failed++; };
// finals: a = 0.6*80 + 0 = 48, b = 70 (unknown keeps plain), c = 0.6*60 + 40 = 76, d = 50  ->  b? no: c 76, b 70, d 50, a 48
check("order is c, b, d, a", list.map((x) => x.user.id).join("") === "cbda");
check("c moved up 2", rows.find((r) => r.candidateId === "c")!.plainRank === 3 && rows.find((r) => r.candidateId === "c")!.finalRank === 1);
check("a moved down 3", rows.find((r) => r.candidateId === "a")!.finalRank === 4);
check("unknown people say so", rows.find((r) => r.candidateId === "b")!.reason.includes("does not know"));
check("people beyond top N keep their place", blendRanking(plain, picks, 2).list.map((x) => x.user.id).join("") === "bacd");
if (failed) process.exit(1);
console.log("ALL PASSED");
