import { connection } from "next/server";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

// Same-site relative paths only, so a forged "next" can't send people elsewhere.
export function safePath(v: unknown, fallback = "/events") {
  const s = String(v ?? "");
  return s.startsWith("/") && !s.startsWith("//") && !s.includes("\\") ? s : fallback;
}

// Call inside a component that sits behind <Suspense>.
// Signed out -> sign-in page, which returns here afterwards when `next` is given (e.g. from a QR scan).
export async function requireUserId(next?: string): Promise<string> {
  await connection();
  const session = await auth();
  if (!session?.user?.id) redirect(next ? `/?next=${encodeURIComponent(next)}` : "/");
  return session.user.id;
}
