import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb } from "@/db";
import { userPhotos } from "@/db/schema";

// Profile pictures are served only to signed-in people. The ?v= in the URL changes when a picture changes, so it can be cached.
export async function GET(_req: Request, ctx: RouteContext<"/api/avatar/[id]">) {
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });
  const session = await auth();
  if (!session?.user?.id) return new Response("Sign in first", { status: 401 });
  const [row] = await getDb().select().from(userPhotos).where(eq(userPhotos.userId, id)).limit(1);
  if (!row) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(Buffer.from(row.data, "base64")), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=31536000, immutable" },
  });
}
