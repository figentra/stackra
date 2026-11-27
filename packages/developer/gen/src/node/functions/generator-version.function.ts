/**
 * Stackra file contract:
 * Purpose: `generatorVersion(from?)`, gen's own version: the `version` of the nearest `package.json` named
 *          `@stackra/gen` above this module (the source tree in this repository, `node_modules/@stackra/gen` once
 *          installed). `checkServerEnvironment` never asks a member for a newer `@stackra/app` than gen itself
 *          (STA-1571).
 * Boundary: reads package.json files upward from `from` (this module's own path by default) and nothing else; answers
 *           undefined when no such package.json is found (gen bundled into another package), and the check then uses
 *           its floor as is.
 * Runtime: node
 * Governing contract: ADR 0296 (amendment 2026-11-26); STA-1571, STA-2844.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Gen's own version, or undefined when it cannot be found.
 *
 * @param from - the folder to search upward from; this module's folder by default.
 * @example
 * generatorVersion(); // "0.34.0"
 */
export function generatorVersion(
  from: string = dirname(fileURLToPath(import.meta.url)),
): string | undefined {
  for (let folder = from; ; folder = dirname(folder)) {
    const path = join(folder, "package.json");
    if (existsSync(path)) {
      const { name, version } = JSON.parse(readFileSync(path, "utf8")) as {
        readonly name?: unknown;
        readonly version?: unknown;
      };
      if (name === "@stackra/gen" && typeof version === "string") return version;
    }
    if (dirname(folder) === folder) return undefined;
  }
}
