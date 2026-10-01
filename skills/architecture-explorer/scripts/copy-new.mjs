import { cpSync, existsSync, mkdirSync, mkdtempSync, renameSync, rmSync } from "node:fs";
import { dirname, join, resolve, relative, sep } from "node:path";
/** Never merge generated files into existing user work. */
export function copyNew(source, destination) {
  source = resolve(source);
  destination = resolve(destination);
  if (existsSync(destination)) throw new Error(`Destination already exists: ${destination}`);
  if (destination === source || destination.startsWith(source + sep))
    throw new Error("Destination cannot be inside the distribution source.");
  mkdirSync(dirname(destination), { recursive: true });
  const staging = mkdtempSync(join(dirname(destination), ".architecture-install-"));
  try {
    const payload = join(staging, "payload");
    cpSync(source, payload, { recursive: true, filter: path => {
      const parts = relative(source, path).split(sep);
      return !parts.some(p => ["node_modules", "dist", ".git", "test-results", "playwright-report"].includes(p));
    }});
    if (existsSync(destination)) throw new Error(`Destination already exists: ${destination}`);
    renameSync(payload, destination);
  } finally { rmSync(staging, { recursive: true, force: true }); }
  return destination;
}
