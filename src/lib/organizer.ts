import { notFound } from "next/navigation";
import { getUser } from "@/lib/queries";
import { requireUserId } from "@/lib/session";

// Admins are GitHub logins listed in ADMIN_GITHUB_LOGINS (comma separated, case-insensitive).
// There is no shared password: you sign in with GitHub like everyone else, and the server checks the list.
export function isAdminLogin(login: string | null | undefined) {
  if (!login) return false;
  const list = (process.env.ADMIN_GITHUB_LOGINS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(login.toLowerCase());
}

// For pages and actions behind <Suspense>. Signed out -> GitHub sign-in, then back here.
// Signed in but not an admin -> 404 (the page's existence is not revealed).
export async function requireAdmin(next: string) {
  const userId = await requireUserId(next);
  const user = await getUser(userId);
  if (!user || !isAdminLogin(user.githubLogin)) notFound();
  return userId;
}

// For showing or hiding Brain details (tabs, scores). Never throws; a missing user is simply not an admin.
export async function isAdminUser(userId: string) {
  const user = await getUser(userId);
  return !!user && isAdminLogin(user.githubLogin);
}
