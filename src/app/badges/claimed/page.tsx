import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { badges } from "@/db/schema";
import { AutoRefresh } from "@/components/AutoRefresh";
import { BackBar, Icon, IconBubble, Lead, Screen, Title, btnPrimary } from "@/components/ui";
import { badgeConfigured, lookupMint, txUrl } from "@/lib/chain";
import { getBadge, getEventBySlug, listBadges } from "@/lib/queries";
import { requireUserId } from "@/lib/session";

type Props = PageProps<"/badges/claimed">;

// Figma 19 · Claim success. Shows the real mint: token number and the BscScan receipt, or "waiting" while it confirms.
async function Claimed({ searchParams }: { searchParams: Props["searchParams"] }) {
  const sp = await searchParams;
  const slug = typeof sp.event === "string" ? sp.event : "";
  const userId = await requireUserId("/badges");
  const event = slug ? await getEventBySlug(slug) : null;
  if (!event) notFound();
  let badge = await getBadge(userId, event.id);
  if (!badge) redirect("/badges");

  // A mint that was still pending: look again now, and fill in the token ID or drop a failed one.
  if (!badge.tokenId && badgeConfigured()) {
    const res = await lookupMint(badge.txHash);
    if (res.state === "confirmed") {
      await getDb().update(badges).set({ tokenId: res.tokenId }).where(and(eq(badges.userId, userId), eq(badges.eventId, event.id)));
      badge = { ...badge, tokenId: res.tokenId };
    } else if (res.state === "reverted") {
      await getDb().delete(badges).where(and(eq(badges.userId, userId), eq(badges.eventId, event.id)));
      redirect(`/badges/wallet?event=${encodeURIComponent(slug)}&error=mint`);
    }
  }
  const all = await listBadges(userId);
  const first = all.length <= 1;

  return (
    <Screen>
      {!badge.tokenId && <AutoRefresh seconds={5} />}
      <div className="mt-8 self-center"><IconBubble name="badge" size={116} /></div>
      <Title size={30} className="mt-12">
        {first ? "Your first chapter." : "Another chapter."}
        <br />
        {badge.tokenId ? "Now in your collection." : "On its way."}
      </Title>
      <Lead className="mt-5 text-[15px] leading-[22px]">
        {badge.tokenId ? "Your attendance badge is on BNB Smart Chain testnet. It stays visible in BuildNear too." : "The chain is confirming your badge. This screen updates by itself."}
      </Lead>
      <div className="mt-9 rounded-[18px] bg-card p-5">
        <p className="text-[18px] font-semibold">{event.title}</p>
        <p className="mt-1.5 text-[12px] text-muted">{badge.tokenId ? `Badge #${badge.tokenId} · non-transferable` : "Waiting for the chain to confirm"}</p>
        <a href={txUrl(badge.txHash)} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-purple">
          View the receipt on BscScan <Icon name="external" size={14} />
        </a>
      </div>
      <Link href="/badges" className={`${btnPrimary} mt-16`}>Back to my badges</Link>
    </Screen>
  );
}

export default function ClaimedPage(props: Props) {
  return (
    <>
      <BackBar href="/badges" title="Your collectible" />
      <Suspense fallback={<p className="p-5 text-muted">Loading…</p>}>
        <Claimed searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}
