import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PeopleFeed, type Tab } from "@/components/PeopleFeed";
import { badgeConfigured, txUrl } from "@/lib/chain";
import { brainEnabled } from "@/lib/brain";
import { isAdminUser } from "@/lib/organizer";
import { getAttendance, getBadge, getEventBySlug, getUser } from "@/lib/queries";
import { requireUserId } from "@/lib/session";
import { QrScanner } from "@/components/QrScanner";
import { checkIn, claimBadge, leaveEvent } from "../actions";

type Props = PageProps<"/events/[slug]">;

const ERRORS: Record<string, string> = {
  code: "That QR or code didn't work. Scan the live QR again, or type the code shown at the venue.",
  window: "Check-in is only open during the event.",
  wallet: "That doesn't look like a wallet address (0x… with 42 characters).",
  minter: "That is the app's own wallet. Paste your personal wallet address from MetaMask.",
  notchecked: "Check in at the venue first, then claim your badge.",
  mint: "The badge couldn't be minted right now. Try again in a minute.",
};

async function EventView({ params, searchParams }: { params: Props["params"]; searchParams: Props["searchParams"] }) {
  const { slug } = await params;
  const sp = await searchParams;
  const error = typeof sp.error === "string" ? ERRORS[sp.error] : undefined;

  const meId = await requireUserId();
  const admin = await isAdminUser(meId);
  const tab: Tab = sp.tab === "for-you" ? "for-you" : admin && sp.tab === "brain" && brainEnabled() ? "brain" : "everyone";
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const attendance = await getAttendance(meId, event.id);
  // Checked in and not marked as left since.
  const atVenue = !!attendance?.checkedInAt && !(attendance.leftAt && attendance.leftAt >= attendance.checkedInAt);
  const [badge, me] = await Promise.all([getBadge(meId, event.id), getUser(meId)]);

  return (
    <main className="flex flex-col gap-4 p-4">
      <div>
        <Link href="/events" className="text-sm text-neutral-500">
          ← Events
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">{event.title}</h1>
        <p className="text-sm text-neutral-500">{event.venue}</p>
      </div>

      {!atVenue && (
        <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
          <p className="text-sm font-medium">At the venue? Scan the QR code on the screen to check in.</p>
          <QrScanner slug={slug} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <details className="text-sm">
            <summary className="cursor-pointer text-neutral-500">QR not working?</summary>
            <form action={checkIn} className="mt-3 flex flex-col gap-2">
              <p className="text-xs text-neutral-500">Ask the organiser for the check-in code and type it here.</p>
              <input type="hidden" name="slug" value={slug} />
              <input
                name="code"
                required
                autoComplete="off"
                autoCapitalize="characters"
                placeholder="Check-in code"
                className="min-h-12 rounded-xl border border-neutral-300 bg-transparent px-4 dark:border-neutral-700"
              />
              <button className="min-h-12 rounded-full border border-neutral-300 px-6 font-medium dark:border-neutral-700" type="submit">
                Check in with code
              </button>
            </form>
          </details>
        </div>
      )}

      {atVenue && (
        <form action={leaveEvent} className="flex items-center justify-between gap-3 rounded-2xl bg-green-100 p-3 dark:bg-green-900/40">
          <input type="hidden" name="slug" value={slug} />
          <p className="text-sm font-medium text-green-800 dark:text-green-300">You're checked in. Others can see you're here.</p>
          <button className="min-h-11 shrink-0 rounded-full border border-green-800/30 px-4 text-sm font-medium text-green-800 dark:text-green-300" type="submit">
            I left
          </button>
        </form>
      )}

      {attendance?.checkedInAt && badgeConfigured() && (
        <div className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
          {badge ? (
            <>
              <p className="text-sm font-medium">Badge claimed.</p>
              <a href={txUrl(badge.txHash)} target="_blank" rel="noreferrer" className="text-sm underline">
                View on BscScan
              </a>
            </>
          ) : (
            <form action={claimBadge} className="flex flex-col gap-2">
              <p className="text-sm font-medium">Claim your attendance badge</p>
              <p className="text-xs text-neutral-500">
                A free, non-transferable badge on BNB testnet. We pay the gas. It only proves you were here.
              </p>
              <input type="hidden" name="slug" value={slug} />
              <input
                name="wallet"
                required
                defaultValue={me?.walletAddress ?? ""}
                autoComplete="off"
                autoCapitalize="none"
                placeholder="Your wallet address (0x…)"
                className="min-h-12 rounded-xl border border-neutral-300 bg-transparent px-4 text-sm dark:border-neutral-700"
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button className="min-h-12 rounded-full bg-accent px-6 font-medium text-black" type="submit">
                Claim badge
              </button>
            </form>
          )}
        </div>
      )}

      {attendance?.checkedInAt && <PeopleFeed eventId={event.id} endsAt={event.endsAt} base={`/events/${slug}`} meId={meId} tab={tab} admin={admin} />}
    </main>
  );
}

export default function EventPage(props: Props) {
  return (
    <Suspense fallback={<p className="p-4 text-neutral-400">Loading…</p>}>
      <EventView params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}
