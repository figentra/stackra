/**
 * Stackra file contract:
 * Purpose: `checkKitFolder(located)`, the kit check on disk: `checkKit` over every file in the kit's folder.
 * Boundary: reads the kit's folder only.
 * Runtime: node
 * Governing contract: ADR 0441 (decisions 4 to 6).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { LocatedKit } from "#contracts/types/located-kit.type";
import { checkKit } from "#core/functions/check-kit.function";
import { listFiles } from "#node/functions/list-files.function";

/**
 * The problems of the kit at `located.dir`.
 *
 * @example
 * checkKitFolder(readKit("assets/brand")); // [] when the kit passes
 */
export function checkKitFolder(located: LocatedKit): string[] {
  return checkKit(located.kit, listFiles(located.dir), (path) =>
    readFileSync(join(located.dir, path), "utf8"),
  );
}
