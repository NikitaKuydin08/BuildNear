// Deploys BuilderBadge to BSC testnet from the minter wallet, then saves BADGE_CONTRACT_ADDRESS to .env.local.
import fs from "node:fs";
import { createPublicClient, createWalletClient, http, formatEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";

const env = fs.readFileSync(".env.local", "utf8");
const get = (k) => env.match(new RegExp(`^${k}=(.*)$`, "m"))?.[1]?.trim();
const key = get("MINTER_PRIVATE_KEY");
if (!key) throw new Error("Run `npm run chain:wallet` first.");
const rpc = get("BSC_TESTNET_RPC_URL") || "https://data-seed-prebsc-1-s1.bnbchain.org:8545";

const account = privateKeyToAccount(key);
const pub = createPublicClient({ chain: bscTestnet, transport: http(rpc) });
const wallet = createWalletClient({ account, chain: bscTestnet, transport: http(rpc) });

const bal = await pub.getBalance({ address: account.address });
console.log(`Minter ${account.address} balance: ${formatEther(bal)} tBNB`);
if (bal === 0n) throw new Error("Balance is 0. Send some tBNB to the minter first.");

const { abi, bytecode } = JSON.parse(fs.readFileSync("contracts/BuilderBadge.json", "utf8"));
const hash = await wallet.deployContract({ abi, bytecode, args: [account.address] });
console.log("Deploy tx:", `https://testnet.bscscan.com/tx/${hash}`);
const rc = await pub.waitForTransactionReceipt({ hash });
const addr = rc.contractAddress;
console.log("Contract:", `https://testnet.bscscan.com/address/${addr}`);

let next = env.replace(/^BADGE_CONTRACT_ADDRESS=.*\n?/m, "");
next += `${next.endsWith("\n") ? "" : "\n"}BADGE_CONTRACT_ADDRESS=${addr}\n`;
fs.writeFileSync(".env.local", next, { mode: 0o600 });
console.log("Saved BADGE_CONTRACT_ADDRESS to .env.local");
