/**
 * Stackra file contract:
 * Purpose: `ownVersion()`, the version of the installed @stackra/console, read from its package.json, so a generated
 *          app depends on the release that made it.
 * Boundary: reads the nearest package.json named `@stackra/console` above this file.
 * Runtime: node
 * Governing contract: STA-1730 spec FR-031.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** This package's version, or `latest` when its package.json is not found. */
export function ownVersion(): string {
  let directory = dirname(fileURLToPath(import.meta.url));
  for (let depth = 0; depth < 6; depth += 1) {
    const file = join(directory, "package.json");
    if (existsSync(file)) {
      const pkg = JSON.parse(readFileSync(file, "utf8")) as { name?: string; version?: string };
      if (pkg.name === "@stackra/console" && pkg.version !== undefined) return pkg.version;
    }
    directory = dirname(directory);
  }
  return "latest";
}
