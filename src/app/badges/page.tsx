import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { BadgeShelf } from "@/components/BadgeShelf";
import { TopBar } from "@/components/TopBar";
import { Eyebrow, Icon, SectionLabel, Screen, Title, btnPrimary, btnSecondary } from "@/components/ui";
import { BADGE_FIELDS, BADGE_LEVELS, badgeSrc, levelIndex } from "@/lib/badge-levels";
import { badgeConfigured } from "@/lib/chain";
import { claimableEvents, fieldProgress, listBadges } from "@/lib/queries";
import { requireUserId } from "@/lib/session";

// Figma 17 · My badges. The levels are the app's own field badges (Newbie 1, Explorer 2, Researcher 4, Veteran 7, Legend 12 events
// in one field), shown in the Figma layout: your strongest field as the hero, its next levels as "Next chapters".
async function Badges() {
  const userId = await requireUserId("/badges");
  const [progress, minted, claimable] = await Promise.all([fieldProgress(userId), listBadges(userId), claimableEvents(userId)]);

  const ranked = BADGE_FIELDS.map((f) => ({ f, count: progress.find((p) => p.field === f.key)?.count ?? 0 }))
    .filter((x) => levelIndex(x.count) >= 0)
    .sort((a, b) => b.count - a.count);
  const hero = ranked[0];
  const level = hero ? BADGE_LEVELS[levelIndex(hero.count)] : null;
  const next = hero ? BADGE_LEVELS.filter((l) => l.at > hero.count) : BADGE_LEVELS.slice(1);
  const canClaim = badgeConfigured() && claimable.length > 0;

  return (
    <>
      {hero && level ? (
        <div className="mt-7 flex flex-col items-center rounded-[24px] bg-lilac px-5 py-6 text-center">
          <Image src={badgeSrc(hero.f.folder, level.file)} alt="" width={150} height={125} unoptimized className="h-auto w-[150px]" />
          <p className="mt-3 text-[26px] font-semibold leading-[32px] text-purple">{level.name}</p>
          <p className="mt-1 text-[14px] text-purple">
            {hero.count} {hero.count === 1 ? "event" : "events"} · {hero.f.label}
          </p>
          <p className="mt-3 text-[10px] font-semibold uppercase tracking-[1.3px] text-purple">Earned</p>
        </div>
      ) : (
        <div className="mt-7 flex flex-col items-center rounded-[24px] bg-lilac px-5 py-8 text-center text-purple">
          <Icon name="badge" size={56} />
          <p className="mt-4 text-[22px] font-semibold">Your first badge is one event away</p>
          <p className="mt-2 text-[14px] leading-[20px]">Check in at an event with the venue QR. Each event counts toward its field.</p>
        </div>
      )}

      {next.length > 0 && (
        <>
          <SectionLabel className="mt-7">{hero ? `Next chapters · ${hero.f.label}` : "Next chapters"}</SectionLabel>
          <ul className="mt-3 grid grid-cols-4 gap-2">
            {next.map((l) => (
              <li key={l.name} className="flex flex-col items-center rounded-[14px] bg-card px-1 py-3 text-center">
                <span className="text-[25px] font-semibold leading-[32px] text-purple">{l.at}</span>
                <span className="mt-1 text-[10px] text-muted">{l.name}</span>
                <span className="text-[9px] text-muted">{l.at === 1 ? "event" : "events"}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {ranked.length > 1 && (
        <>
          <SectionLabel className="mt-8">Other fields</SectionLabel>
          <div className="mt-3">
            <BadgeShelf rows={progress} showNext skip={hero?.f.key} />
          </div>
        </>
      )}

      {badgeConfigured() && (
        <>
          <p className="mt-8 text-[14px] leading-[21px] text-muted">
            Your badge is already yours in BuildNear.
            <br />
            A wallet collectible is optional.
          </p>
          {canClaim && (
            <Link href="/badges/wallet" className={`${btnPrimary} mt-5`}>
              Save a collectible to my wallet
            </Link>
          )}
        </>
      )}

      {minted.length > 0 && (
        <>
          <SectionLabel className="mt-8">In your wallet · BNB testnet</SectionLabel>
          <ul className="mt-3 flex flex-col gap-2">
            {minted.map(({ badge, event }) => (
              <li key={event.id}>
                <Link href={`/badges/claimed?event=${encodeURIComponent(event.slug)}`} className="flex items-center gap-3 rounded-[16px] bg-card p-4">
                  <span className="text-purple"><Icon name="badge" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold">{event.title}</span>
                    <span className="block text-[12px] text-muted">{badge.tokenId ? `Badge #${badge.tokenId}` : "Waiting for the chain to confirm"}</span>
                  </span>
                  <span className="text-muted"><Icon name="arrow" size={20} /></span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {!hero && (
        <Link href="/events" className={`${btnSecondary} mt-6`}>See events</Link>
      )}
    </>
  );
}

export default function BadgesPage() {
  return (
    <>
      <TopBar />
      <Screen>
        <Eyebrow className="mt-2">Your story, one event at a time</Eyebrow>
        <Title size={30} className="mt-3">
          Small steps.
          <br />
          Real connections.
        </Title>
        <Suspense fallback={<p className="mt-6 text-muted">Loading…</p>}>
          <Badges />
        </Suspense>
      </Screen>
    </>
  );
}
