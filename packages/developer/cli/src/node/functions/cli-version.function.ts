/**
 * Stackra file contract:
 * Purpose: `cliVersion()`, the version of the installed `@stackra/cli`: what `stackra --version` prints and what the
 *          local MCP reports as its server version.
 * Boundary: reads this package's own package.json, found by walking up from this module, so it works from `src/`
 *           and from `dist/` alike.
 * Runtime: node
 * Governing contract: ADR 0177 (decision 5: one fixed `@stackra/*` version); ADR 0282 (decision 5).
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * The `@stackra/cli` version.
 *
 * @throws Error when no `@stackra/cli` package.json sits above this module (a broken install).
 * @example
 * cliVersion(); // "0.4.0"
 */
export function cliVersion(): string {
  let folder = dirname(fileURLToPath(import.meta.url));
  for (;;) {
    const file = join(folder, "package.json");
    if (existsSync(file)) {
      const manifest = JSON.parse(readFileSync(file, "utf8")) as {
        name?: unknown;
        version?: unknown;
      };
      if (manifest.name === "@stackra/cli" && typeof manifest.version === "string") {
        return manifest.version;
      }
    }
    const parent = dirname(folder);
    if (parent === folder) throw new Error("no @stackra/cli package.json above the binary");
    folder = parent;
  }
}
