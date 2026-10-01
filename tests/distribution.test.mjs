import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, existsSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
const skill = join(root, "skills/architecture-explorer");
const run = (file, args) => execFileSync(process.execPath, [file, ...args], { encoding: "utf8" });
test("installed Codex skill scaffolds independently without overwriting existing work", () => {
  const temp = mkdtempSync(join(tmpdir(), "architecture-distribution-"));
  try {
    const installed = join(temp, "repo with spaces/.agents/skills/architecture-explorer");
    run(join(root, "scripts/install-codex.mjs"), [installed]);
    const output = join(temp, "different repo/architecture");
    run(join(installed, "scripts/init.mjs"), ["init", output]);
    assert.ok(existsSync(join(output, "src/App.tsx")));
    assert.ok(existsSync(join(output, "package-lock.json")));
    assert.ok(!existsSync(join(output, "src/projects/station-control")));
    assert.ok(!existsSync(join(installed, "renderer/node_modules")));
    const marker = join(output, "keep.txt"); writeFileSync(marker, "user work");
    const result = spawnSync(process.execPath, [join(installed, "scripts/init.mjs"), "init", output]);
    assert.notEqual(result.status, 0);
    assert.equal(readFileSync(marker, "utf8"), "user work");
    assert.equal(spawnSync(process.execPath, [join(root,"scripts/install-codex.mjs"), installed]).status, 1);
  } finally { rmSync(temp, {recursive:true,force:true}); }
});
test("archive contains complete plugin and skill, excluding dependencies and simulator data", () => {
  const temp = mkdtempSync(join(tmpdir(), "architecture-pack-"));
  try {
    const [pack] = JSON.parse(execFileSync("npm", ["pack", "--json", "--pack-destination", temp], {cwd:root,encoding:"utf8"}));
    const files = pack.files.map(f => f.path);
    for (const file of ["plugin.json", ".agents/plugins/marketplace.json", ".claude-plugin/plugin.json", ".claude-plugin/marketplace.json", "skills/architecture-explorer/SKILL.md", "skills/architecture-explorer/renderer/src/App.tsx", "skills/architecture-explorer/renderer/package-lock.json", "skills/architecture-explorer/scripts/init.mjs"]) assert.ok(files.includes(file), file);
    assert.ok(!files.some(p => /node_modules|station-control|demo-runs.json|source-index.json|\/dist\//.test(p)));
    const unpacked = join(temp, "extracted");mkdirSync(unpacked);
    execFileSync("tar", ["-xzf", join(temp, pack.filename), "-C", unpacked]);
    run(join(unpacked, "package/skills/architecture-explorer/scripts/init.mjs"), ["init",join(temp,"canvas")]);
    assert.ok(existsSync(join(temp,"canvas/src/diagram/layout.ts")));
    assert.match(readFileSync(join(temp,"canvas/.gitignore"),"utf8"), /node_modules/);
  } finally { rmSync(temp, {recursive:true,force:true}); }
});
test("Claude manifests and shared skill agree on distribution identity", () => {
  const pkg = JSON.parse(readFileSync(join(root,"package.json")));
  const manifest = JSON.parse(readFileSync(join(root,".claude-plugin/plugin.json")));
  const marketplace = JSON.parse(readFileSync(join(root,".claude-plugin/marketplace.json")));
  assert.equal(manifest.name,pkg.name);assert.equal(manifest.version,pkg.version);
  assert.equal(marketplace.plugins[0].source,"./");assert.equal(marketplace.plugins[0].version,pkg.version);
  assert.match(readFileSync(join(skill,"SKILL.md"),"utf8"), /^---\nname: architecture-explorer\n/);
});

test("portable plugin and Codex catalog resolve the same self-contained skill", () => {
  const pkg = JSON.parse(readFileSync(join(root,"package.json")));
  const manifest = JSON.parse(readFileSync(join(root,"plugin.json")));
  const catalog = JSON.parse(readFileSync(join(root,".agents/plugins/marketplace.json")));
  assert.equal(manifest.name,pkg.name);
  assert.equal(manifest.version,pkg.version);
  assert.equal(catalog.plugins[0].name,manifest.name);
  assert.deepEqual(catalog.plugins[0].source,{source:"local",path:"./"});
  assert.ok(existsSync(join(root,catalog.plugins[0].source.path,"plugin.json")));
  assert.ok(existsSync(join(root,catalog.plugins[0].source.path,"skills/architecture-explorer/SKILL.md")));
});
