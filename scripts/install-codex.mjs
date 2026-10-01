import { fileURLToPath } from "node:url";
import { copyNew } from "../skills/architecture-explorer/scripts/copy-new.mjs";
const args = process.argv.slice(2);
if (args.length !== 1) {
  console.error("Usage: node scripts/install-codex.mjs <target-repo>/.agents/skills/architecture-explorer");
  process.exitCode = 1;
} else {
  try { console.log(`Installed ${copyNew(fileURLToPath(new URL("../skills/architecture-explorer/", import.meta.url)), args[0])}`); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
