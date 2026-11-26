import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { TopBar } from "@/components/TopBar";
import { Eyebrow, Icon, Lead, Poster, Screen, Title, btnPrimary } from "@/components/ui";
import { eventCounts, getEventBySlug } from "@/lib/queries";
import { safePath } from "@/lib/session";

// Figma 01 · QR arrival. When the sign-in was opened from an event QR, the event card is shown; otherwise the plain welcome.
async function Arrival({ next }: { next: Promise<string | string[] | undefined> }) {
  await connection();
  const session = await auth();
  const target = safePath(await next);
  if (session?.user) redirect(target);

  const slug = target.match(/^\/events\/([^/?]+)\/checkin/)?.[1];
  const event = slug ? await getEventBySlug(decodeURIComponent(slug)) : null;
  const counts = event ? await eventCounts(event.id) : null;

  return (
    <>
      {event && counts && (
        <section className="mt-7 flex flex-col">
          <Poster title={event.title} startsAt={event.startsAt} />
          <p className="mt-[22px] text-[23px] font-semibold leading-[32px]">{event.title}</p>
          <p className="mt-1 text-[14px] leading-[20px] text-muted">
            {event.venue} · {counts.joined} {counts.joined === 1 ? "builder" : "builders"} joining
          </p>
        </section>
      )}

      <div className="mt-7 flex gap-[10px]">
        <span className="text-purple"><Icon name="shield" /></span>
        <div>
          <p className="text-[13px] font-semibold leading-[18px]">{event ? "Meet here. Keep your location private." : "Your contacts stay private."}</p>
          <p className="mt-1.5 text-[12px] leading-[17px] text-muted">
            {event ? "You choose when your profile becomes visible." : "They are shown only to people whose introduction you accept."}
          </p>
        </div>
      </div>

      <details className="mt-5 rounded-[16px] bg-card p-4 text-[12px] leading-[17px] text-muted">
        <summary className="cursor-pointer font-semibold text-ink">What GitHub will ask, in plain words</summary>
        <p className="mt-2">
          GitHub shows &quot;act on your behalf&quot; for every app. BuildNear is set up read-only: it reads your public profile (name, picture, public repos) and, only if you choose them,
          the repos you share. It cannot post, push, star, comment or change anything on your account.
        </p>
      </details>

      <form
        className="mt-8"
        action={async () => {
          "use server";
          await signIn("github", { redirectTo: target });
        }}
      >
        <button className={btnPrimary} type="submit">
          Continue with GitHub
        </button>
      </form>
      <p className="mt-4 text-center text-[12px] text-muted">No download. No wallet needed.</p>
      <p className="mt-3 text-center text-[11px] leading-[16px] text-muted">
        By signing in you agree to the <Link href="/privacy" className="underline">privacy notice</Link>: what we collect, why, and how to delete it.
      </p>
      <Link href="/admin/events" className="mt-3 self-center text-[11px] text-muted underline">
        Staff
      </Link>
    </>
  );
}

export default function Home(props: PageProps<"/">) {
  return (
    <>
      <TopBar showMe={false} />
      <Screen>
        <Eyebrow className="mt-2">A room full of possibilities</Eyebrow>
        <Title size={36} className="mt-3">
          You’re in the
          <br />
          right room.
        </Title>
        <Lead className="mt-3">Meet the builders behind the projects.</Lead>
        <Suspense fallback={<p className="mt-8 text-muted">Loading…</p>}>
          <Arrival next={props.searchParams.then((sp) => sp.next)} />
        </Suspense>
      </Screen>
    </>
  );
}
