import { createPublicClient, createWalletClient, http, isAddress, keccak256, parseEventLogs, toBytes, type Hex, type TransactionReceipt } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";
import badge from "../../contracts/BuilderBadge.json";

export const abi = badge.abi;

export function badgeConfigured() {
  return !!(process.env.MINTER_PRIVATE_KEY && process.env.BADGE_CONTRACT_ADDRESS);
}

export function isWallet(v: string) {
  return isAddress(v, { strict: false });
}

// True if the address is the app's own minter wallet (derived from the key, nothing extra to configure).
export function isMinterAddress(v: string) {
  const key = process.env.MINTER_PRIVATE_KEY as Hex | undefined;
  if (!key) return false;
  return privateKeyToAccount(key).address.toLowerCase() === v.toLowerCase();
}

export const txUrl = (hash: string) => `https://testnet.bscscan.com/tx/${hash}`;

function clients() {
  const key = process.env.MINTER_PRIVATE_KEY as Hex | undefined;
  const address = process.env.BADGE_CONTRACT_ADDRESS as Hex | undefined;
  if (!key || !address) throw new Error("Badge minting is not configured");
  const transport = http(process.env.BSC_TESTNET_RPC_URL);
  const account = privateKeyToAccount(key);
  return {
    address,
    wallet: createWalletClient({ account, chain: bscTestnet, transport }),
    pub: createPublicClient({ chain: bscTestnet, transport }),
  };
}

// Event titles end up inside the badge's on-chain JSON/SVG, so characters that could break it are removed.
export const safeTitle = (t: string) => t.replace(/["\\<>&\u0000-\u001f]/g, "").trim().slice(0, 60);

// Does this wallet already hold a badge for this event? (The contract allows one per wallet and event.)
export async function hasBadgeOnChain(to: string, eventSlug: string) {
  const { address, pub } = clients();
  return (await pub.readContract({ address, abi, functionName: "hasBadge", args: [to as Hex, keccak256(toBytes(eventSlug))] })) as boolean;
}

// Server-side only. The minter wallet pays gas; the user never needs tBNB.
// Step 1: send the transaction and return its hash straight away, so it can be saved before waiting for confirmation.
export async function sendMint(to: string, eventSlug: string, eventTitle: string) {
  const { address, wallet } = clients();
  return wallet.writeContract({ address, abi, functionName: "mint", args: [to as Hex, eventSlug, safeTitle(eventTitle)] });
}

export type MintResult = { state: "confirmed"; tokenId: string | null } | { state: "reverted" } | { state: "pending" };

function tokenIdFrom(receipt: TransactionReceipt, address: Hex) {
  const logs = parseEventLogs({ abi, logs: receipt.logs.filter((l) => l.address.toLowerCase() === address.toLowerCase()), eventName: "Transfer" });
  const id = (logs[0] as unknown as { args?: { tokenId?: bigint } } | undefined)?.args?.tokenId;
  return id === undefined ? null : id.toString();
}

// Step 2: wait (up to `waitMs`) for the receipt. A timeout is "pending", not a failure: the transaction may still confirm.
export async function confirmMint(hash: string, waitMs = 45_000): Promise<MintResult> {
  const { address, pub } = clients();
  try {
    const receipt = await pub.waitForTransactionReceipt({ hash: hash as Hex, timeout: waitMs });
    return receipt.status === "success" ? { state: "confirmed", tokenId: tokenIdFrom(receipt, address) } : { state: "reverted" };
  } catch {
    return { state: "pending" };
  }
}

// Quick look (no waiting) at a transaction that was still pending when the user left.
export async function lookupMint(hash: string): Promise<MintResult> {
  return confirmMint(hash, 1_500);
}
