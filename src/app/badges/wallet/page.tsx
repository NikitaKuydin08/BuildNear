import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { claimBadge } from "@/app/events/actions";
import { BackBar, Eyebrow, Icon, Screen, Title, btnPrimary, inputCls } from "@/components/ui";
import { badgeConfigured } from "@/lib/chain";
import { claimableEvents, getUser } from "@/lib/queries";
import { requireUserId } from "@/lib/session";

type Props = PageProps<"/badges/wallet">;

const ERRORS: Record<string, string> = {
  wallet: "That doesn't look like a wallet address (0x… with 42 characters).",
  minter: "That is the app's own wallet. Paste your personal wallet address from MetaMask.",
  notchecked: "Check in at the venue first, then claim your badge.",
  mint: "The badge couldn't be minted right now. Try again in a minute.",
  onchain: "This wallet already holds a badge for this event.",
};

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-card text-[14px] font-semibold text-purple">{n}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[16px] font-semibold leading-[22px]">{title}</p>
        <div className="mt-1 text-[13px] leading-[19px] text-muted">{children}</div>
      </div>
    </div>
  );
}

// Figma 18 · Optional wallet claim. Real: a free, non-transferable attendance badge on BNB Smart Chain testnet; the app pays the gas.
async function Wallet({ searchParams }: { searchParams: Props["searchParams"] }) {
  const sp = await searchParams;
  const userId = await requireUserId("/badges/wallet");
  if (!badgeConfigured()) redirect("/badges");
  const [me, events] = await Promise.all([getUser(userId), claimableEvents(userId)]);
  if (events.length === 0) redirect("/badges");
  const chosen = events.find((e) => e.slug === sp.event) ?? events[0];
  const error = typeof sp.error === "string" ? ERRORS[sp.error] : undefined;

  return (
    <Screen>
      <Eyebrow className="mt-2">Optional · Your collectible</Eyebrow>
      <Title size={30} className="mt-3">
        Take your story
        <br />
        with you.
      </Title>

      <div className="mt-7 flex items-center gap-4 rounded-[20px] bg-lilac p-6 text-purple">
        <Icon name="badge" size={40} />
        <div className="min-w-0">
          <p className="truncate text-[21px] font-semibold leading-[28px]">{chosen.title}</p>
          <p className="text-[13px]">Attendance badge · verified check-in</p>
        </div>
      </div>
      {events.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {events.map((e) => (
            <Link
              key={e.id}
              href={`/badges/wallet?event=${encodeURIComponent(e.slug)}`}
              className={`shrink-0 rounded-[10px] px-3 py-2 text-[12px] font-medium ${e.id === chosen.id ? "bg-purple text-white" : "border border-line bg-card text-muted"}`}
            >
              {e.title}
            </Link>
          ))}
        </div>
      )}

      <form action={claimBadge} className="mt-9 flex flex-col gap-7">
        <input type="hidden" name="slug" value={chosen.slug} />
        <Step n={1} title="Paste your wallet address">
          <p>Your personal address from MetaMask. You can add one after the event too.</p>
          <input
            name="wallet"
            required
            defaultValue={me?.walletAddress ?? ""}
            autoComplete="off"
            autoCapitalize="none"
            placeholder="0x…"
            aria-label="Wallet address"
            className={`${inputCls} mt-3 font-mono text-[13px]`}
          />
        </Step>
        <Step n={2} title="Review before confirming">
          BNB Smart Chain testnet. We pay the gas, so there is no fee for you. No wallet connection needed.
        </Step>
        <Step n={3} title="Keep your collectible">
          It can’t be sold or transferred. Your in-app badge stays yours too.
        </Step>
        {error && <p className="text-[13px] text-red-600">{error}</p>}
        <button type="submit" className={btnPrimary}>
          Claim my collectible
        </button>
      </form>
      <p className="mt-6 text-center text-[11px] text-muted">Your wallet address is never shown to other people.</p>
    </Screen>
  );
}

export default function WalletPage(props: Props) {
  return (
    <>
      <BackBar href="/badges" title="Your collectible" />
      <Suspense fallback={<p className="p-5 text-muted">Loading…</p>}>
        <Wallet searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}
