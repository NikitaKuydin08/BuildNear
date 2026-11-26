import QRCode from "qrcode";
import { auth } from "@/auth";
import { isAdminLogin } from "@/lib/organizer";
import { getEventBySlug, getUser } from "@/lib/queries";
import { makeToken, TOKEN_STEP_SECONDS } from "@/lib/qr-token";

const STEP_MS = TOKEN_STEP_SECONDS * 1000;

// Returns the current QR (as an image) for the admin screen. Only signed-in admins get it.
export async function GET(req: Request, ctx: RouteContext<"/api/qr/[slug]">) {
  const { slug } = await ctx.params;
  const session = await auth();
  const me = session?.user?.id ? await getUser(session.user.id) : null;
  if (!me || !isAdminLogin(me.githubLogin)) return new Response("Not found", { status: 404 });

  const event = await getEventBySlug(slug);
  if (!event) return new Response("Not found", { status: 404 });

  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const now = Date.now();
  const url = `${proto}://${host}/events/${slug}/checkin?t=${makeToken(event.id, now)}`;
  const image = await QRCode.toDataURL(url, { margin: 2, width: 640 });
  // The QR changes at the next 30 s boundary. serverNow lets the screen correct for clock differences.
  const expiresAt = (Math.floor(now / STEP_MS) + 1) * STEP_MS;
  return Response.json({ image, expiresAt, serverNow: now, stepMs: STEP_MS }, { headers: { "Cache-Control": "no-store" } });
}
