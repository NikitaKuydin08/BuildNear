// Local, throwaway chain: checks mint works and every transfer path reverts.
import fs from "node:fs";
import ganache from "ganache";
import { createWalletClient, createPublicClient, custom } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { defineChain } from "viem";
const bsc = defineChain({ id: 1337, name: "local", nativeCurrency: { name: "T", symbol: "T", decimals: 18 }, rpcUrls: { default: { http: ["http://localhost"] } } });

const { abi, bytecode } = JSON.parse(fs.readFileSync("contracts/BuilderBadge.json", "utf8"));
const keys = ["0x" + "11".repeat(32), "0x" + "22".repeat(32), "0x" + "33".repeat(32)];
const provider = ganache.provider({ logging: { quiet: true }, wallet: { accounts: keys.map((k) => ({ secretKey: k, balance: "0x56BC75E2D63100000" })) } });
const [owner, alice, bob] = keys.map((k) => privateKeyToAccount(k));
const mk = (account) => createWalletClient({ account, chain: bsc, transport: custom(provider) });
const pub = createPublicClient({ chain: bsc, transport: custom(provider) });

let pass = 0;
const ok = (c, m) => { if (!c) { console.error("FAIL:", m); process.exit(1); } pass++; console.log("ok:", m); };
// With an explicit gas limit the tx is mined even if it reverts, so check the receipt status too.
const reverts = async (fn, m) => {
  try { const r = await pub.waitForTransactionReceipt({ hash: await fn() }); return ok(r.status === "reverted", m); }
  catch { return ok(true, m); }
};

const hash = await mk(owner).deployContract({ abi, bytecode, args: [owner.address] });
const { contractAddress: addr } = await pub.waitForTransactionReceipt({ hash });
const mint = (acct, to, slug) => mk(acct).writeContract({ address: addr, abi, functionName: "mint", args: [to, slug, "Bangkok AI Night"], gas: 500000n });

await pub.waitForTransactionReceipt({ hash: await mint(owner, alice.address, "ev1") });
ok((await pub.readContract({ address: addr, abi, functionName: "ownerOf", args: [1n] })) === alice.address, "owner mints to alice");
await reverts(() => mint(owner, alice.address, "ev1"), "second badge for same event reverts");
await pub.waitForTransactionReceipt({ hash: await mint(owner, alice.address, "ev2") });
ok(true, "same wallet can badge a different event");
await reverts(() => mint(alice, alice.address, "ev3"), "non-owner cannot mint");
await reverts(() => mk(alice).writeContract({ address: addr, abi, functionName: "transferFrom", args: [alice.address, bob.address, 1n], gas: 200000n }), "holder cannot transfer");
await reverts(() => mk(alice).writeContract({ address: addr, abi, functionName: "safeTransferFrom", args: [alice.address, bob.address, 1n], gas: 200000n }), "holder cannot safeTransfer");
const uri = await pub.readContract({ address: addr, abi, functionName: "tokenURI", args: [1n], gas: 5_000_000n });
const json = JSON.parse(Buffer.from(uri.split(",")[1], "base64").toString());
ok(json.name === "Builder Badge #1" && json.image.startsWith("data:image/svg+xml;base64,"), "tokenURI is valid on-chain JSON with an image");
console.log(`${pass} checks passed`);
process.exit(0);
