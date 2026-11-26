import QRCode from "qrcode";
import { auth } from "@/auth";
import { isAdminLogin } from "@/lib/organizer";
import { getEventBySlug, getUser } from "@/lib/queries";
import { makeToken, TOKEN_STEP_SECONDS } from "@/lib/qr-token";

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
  const url = `${proto}://${host}/events/${slug}/checkin?t=${makeToken(event.id)}`;
  const image = await QRCode.toDataURL(url, { margin: 2, width: 640 });
  return Response.json({ image, refreshIn: TOKEN_STEP_SECONDS }, { headers: { "Cache-Control": "no-store" } });
}
