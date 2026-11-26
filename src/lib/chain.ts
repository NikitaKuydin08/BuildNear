import { createPublicClient, createWalletClient, http, isAddress, type Hex } from "viem";
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

// Server-side only. The minter wallet pays gas; the user never needs tBNB.
export async function mintBadge(to: string, eventSlug: string, eventTitle: string) {
  const key = process.env.MINTER_PRIVATE_KEY as Hex | undefined;
  const address = process.env.BADGE_CONTRACT_ADDRESS as Hex | undefined;
  if (!key || !address) throw new Error("Badge minting is not configured");

  const transport = http(process.env.BSC_TESTNET_RPC_URL);
  const account = privateKeyToAccount(key);
  const wallet = createWalletClient({ account, chain: bscTestnet, transport });
  const pub = createPublicClient({ chain: bscTestnet, transport });

  const hash = await wallet.writeContract({
    address,
    abi,
    functionName: "mint",
    args: [to as Hex, eventSlug, eventTitle.slice(0, 60)],
  });
  const receipt = await pub.waitForTransactionReceipt({ hash, timeout: 45_000 });
  if (receipt.status !== "success") throw new Error("Mint transaction failed");
  return hash;
}
