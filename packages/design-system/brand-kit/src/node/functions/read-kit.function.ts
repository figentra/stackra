/**
 * Stackra file contract:
 * Purpose: `readKit(dir)`, the kit in a folder: its `kit.json` read and parsed, defaults applied, with the folder's
 *          absolute path.
 * Boundary: reads one file. A folder without `kit.json` is an InvalidKitError, so a caller can skip it with a note.
 * Runtime: node
 * Governing contract: ADR 0441 (decision 4); ported from figentra/os `tools/brand-kit/lib/kits.mjs` (ORIGIN.md).
 */
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import type { LocatedKit } from "#contracts/types/located-kit.type";
import { InvalidKitError } from "#core/errors/invalid-kit.error";
import { parseKit } from "#core/functions/parse-kit.function";

/**
 * The kit in `dir`.
 *
 * @throws InvalidKitError when the folder has no `kit.json` or it breaks the schema.
 * @example
 * const { kit, dir } = readKit("assets/brand");
 */
export function readKit(dir: string): LocatedKit {
  const absolute = resolve(dir);
  const file = join(absolute, "kit.json");
  if (!existsSync(file)) throw new InvalidKitError(dir, ["no kit.json"]);
  return { kit: parseKit(readFileSync(file, "utf8"), file), dir: absolute };
}
