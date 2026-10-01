#!/usr/bin/env node
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { copyNew } from "./copy-new.mjs";
const args = process.argv.slice(2);
if (args.length !== 2 || args[0] !== "init") {
  console.error("Usage: architecture-explorer init <new-directory>");
  process.exitCode = 1;
} else {
  try {
    const target = copyNew(fileURLToPath(new URL("../renderer/", import.meta.url)), args[1]);
    if (!existsSync(join(target, ".gitignore")))
      writeFileSync(join(target, ".gitignore"), "node_modules/\ndist/\ntest-results/\nplaywright-report/\n.env\n.env.*\n");
    console.log(`Created ${target}\nRun npm ci there, edit src/project.ts, then npm run build.\nOpen or share dist/index.html; no application server is needed.`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
