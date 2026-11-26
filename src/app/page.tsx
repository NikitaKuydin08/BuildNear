import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { safePath } from "@/lib/session";

// With Cache Components, reading the session is request-time data, so it sits behind <Suspense>.
async function AuthPanel({ next }: { next: Promise<string | string[] | undefined> }) {
  // Mark this component as request-time before Auth.js runs (it uses crypto internally).
  await connection();
  const session = await auth();
  const target = safePath(await next);
  if (session?.user) redirect(target);

  return (
    <form
      action={async () => {
        "use server";
        await signIn("github", { redirectTo: target });
      }}
    >
      <button
        className="min-h-12 rounded-full bg-black px-8 font-medium text-white dark:bg-white dark:text-black"
        type="submit"
      >
        Sign in with GitHub
      </button>
    </form>
  );
}

export default function Home(props: PageProps<"/">) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-3xl font-semibold">BuildNear</h1>
      <p className="text-neutral-500">
        Find builders to talk to at events, cafes and co-working spaces.
      </p>
      <Suspense fallback={<p className="text-neutral-400">Loading…</p>}>
        <AuthPanel next={props.searchParams.then((sp) => sp.next)} />
      </Suspense>
      <Link href="/admin/events" className="text-sm text-neutral-500 underline">
        Staff
      </Link>
    </main>
  );
}
