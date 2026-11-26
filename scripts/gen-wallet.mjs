// Creates the app's minter wallet and saves its key to .env.local. The key is never printed.
import fs from "node:fs";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const envPath = ".env.local";
let env = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
const m = env.match(/^MINTER_PRIVATE_KEY=(0x[0-9a-fA-F]{64})\s*$/m);
let key = m?.[1];
if (!key) {
  key = generatePrivateKey();
  if (/^MINTER_PRIVATE_KEY=.*$/m.test(env)) env = env.replace(/^MINTER_PRIVATE_KEY=.*$/m, `MINTER_PRIVATE_KEY=${key}`);
  else env += `${env.endsWith("\n") || env === "" ? "" : "\n"}MINTER_PRIVATE_KEY=${key}\n`;
  fs.writeFileSync(envPath, env, { mode: 0o600 });
  console.log("New minter wallet created and saved to .env.local (key not shown).");
} else {
  console.log("Minter wallet already exists in .env.local.");
}
console.log("Send ~0.05 tBNB (BSC Testnet) to this address:");
console.log(privateKeyToAccount(key).address);
