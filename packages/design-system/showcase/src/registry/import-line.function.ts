/**
 * Stackra file contract:
 * Purpose: `importLine`, the import statement of an entry on one platform.
 * Boundary: a pure function; never translated (shown left to right).
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 4.
 */
import type { Platform } from "#src/enums/platform.enum";
import type { ComponentEntry } from "#src/types/component-entry.type";

/** `import { Button } from "@stackra/ui/react";` for `entry` on `platform`. */
export function importLine(
  entry: Pick<ComponentEntry, "packageName" | "exportName">,
  platform: Platform,
): string {
  return `import { ${entry.exportName} } from "${entry.packageName}/${platform}";`;
}
