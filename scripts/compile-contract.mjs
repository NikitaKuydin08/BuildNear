// Compiles contracts/BuilderBadge.sol with solc-js and writes contracts/BuilderBadge.json (abi + bytecode).
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const solc = require("solc");

const file = "contracts/BuilderBadge.sol";
const input = {
  language: "Solidity",
  sources: { [file]: { content: fs.readFileSync(file, "utf8") } },
  settings: { evmVersion: "paris", optimizer: { enabled: true, runs: 200 }, outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } } },
};
function findImports(p) {
  try { return { contents: fs.readFileSync(path.join("node_modules", p), "utf8") }; }
  catch { return { error: "not found: " + p }; }
}
const out = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
const errs = (out.errors ?? []).filter((e) => e.severity === "error");
for (const e of out.errors ?? []) console.log(e.formattedMessage);
if (errs.length) process.exit(1);
const c = out.contracts[file].BuilderBadge;
fs.writeFileSync("contracts/BuilderBadge.json", JSON.stringify({ abi: c.abi, bytecode: "0x" + c.evm.bytecode.object }, null, 2));
console.log("OK: contracts/BuilderBadge.json written");
