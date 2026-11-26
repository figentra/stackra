/**
 * Stackra file contract:
 * Purpose: `cliVersion()`, the version of the installed `@stackra/cli`: what `stackra --version` prints and what the
 *          local MCP reports as its server version.
 * Boundary: reads this package's own package.json, found by `cliPackageRoot`, so it works from `src/` and from
 *           `dist/` alike.
 * Runtime: node
 * Governing contract: ADR 0177 (decision 5: one fixed `@stackra/*` version); ADR 0282 (decision 5).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { cliPackageRoot } from "#node/functions/cli-package-root.function";

/**
 * The `@stackra/cli` version.
 *
 * @throws Error when no `@stackra/cli` package.json sits above this module (a broken install), or it has no version.
 * @example
 * cliVersion(); // "0.4.0"
 */
export function cliVersion(): string {
  const manifest = JSON.parse(readFileSync(join(cliPackageRoot(), "package.json"), "utf8")) as {
    version?: unknown;
  };
  if (typeof manifest.version !== "string") throw new Error("@stackra/cli has no version");
  return manifest.version;
}
