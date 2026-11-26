import { createHmac, timingSafeEqual } from "node:crypto";

// Rotating check-in token: HMAC(secret, eventId + 30-second window). No database needed.
// The server accepts the current window and the two before it (about 90 s), so a photo of an old QR is useless.
const STEP_MS = 30_000;
const ACCEPT_WINDOWS = 3;

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return s;
}

function sign(eventId: string, window: number) {
  return createHmac("sha256", secret()).update(`${eventId}:${window}`).digest("base64url").slice(0, 20);
}

export const TOKEN_STEP_SECONDS = STEP_MS / 1000;

export function makeToken(eventId: string, now = Date.now()) {
  return sign(eventId, Math.floor(now / STEP_MS));
}

export function verifyToken(eventId: string, token: string, now = Date.now()) {
  const cur = Math.floor(now / STEP_MS);
  const given = Buffer.from(token);
  for (let i = 0; i < ACCEPT_WINDOWS; i++) {
    const want = Buffer.from(sign(eventId, cur - i));
    if (want.length === given.length && timingSafeEqual(want, given)) return true;
  }
  return false;
}
