/**
 * Stackra file contract:
 * Purpose: `readJsonc(path)`, reads and parses a .json or .jsonc file.
 * Boundary: reads one file; parse errors propagate.
 * Runtime: node
 * Governing contract: the JSON vs JSONC rule (STA-299).
 */
import { readFileSync } from "node:fs";

import { stripJsonc } from "#node/functions/strip-jsonc.function";

/**
 * The parsed contents of the JSON or JSONC file at `path`.
 *
 * @param path - an absolute or working-directory-relative path.
 * @example
 * readJsonc("/repo/turbo.jsonc");
 */
export function readJsonc(path: string): unknown {
  return JSON.parse(stripJsonc(readFileSync(path, "utf8")));
}
