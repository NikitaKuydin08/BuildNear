// Checks the rotating QR token: fresh and recent tokens pass, old / foreign / tampered ones fail.
process.env.AUTH_SECRET = "test-secret";
const { makeToken, verifyToken } = await import("../src/lib/qr-token.ts");

let pass = 0;
const ok = (c: boolean, m: string) => {
  if (!c) { console.error("FAIL:", m); process.exit(1); }
  pass++; console.log("ok:", m);
};

const now = 1_800_000_000_000;
const t = makeToken("event-a", now);
ok(verifyToken("event-a", t, now), "fresh token is accepted");
ok(verifyToken("event-a", t, now + 60_000), "token 60 s old is accepted");
ok(!verifyToken("event-a", t, now + 120_000), "token 120 s old is rejected");
ok(!verifyToken("event-b", t, now), "token for another event is rejected");
ok(!verifyToken("event-a", t.slice(0, -1) + (t.endsWith("A") ? "B" : "A"), now), "tampered token is rejected");
ok(!verifyToken("event-a", "", now), "empty token is rejected");
ok(makeToken("event-a", now) !== makeToken("event-a", now + 30_000), "token changes every 30 s");
console.log(`${pass} checks passed`);
