/**
 * Stackra file contract:
 * Purpose: `specStatusOf(text)`, the lower-cased `**Status**` a spec declares.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0120 (SDLC spec location, lanes and change risk); ADR 0198; ADR 0282 (decision 3). Loaded by
 *                     plain Node from source by core's `tools/scripts` wrappers, so it imports values by relative
 *                     `.ts` paths and uses erasable TypeScript only (ADR 0421 decision 2).
 */
import { specStrip } from "./spec-strip.function.ts";

/**
 * The declared status, lower-cased; `""` when absent.
 *
 * @param text - the spec.md text.
 * @example
 * specStatusOf("**Status**: Planned"); // "planned"
 */
export function specStatusOf(text: string): string {
  return /^\*\*Status\*\*:\s*([A-Za-z]+)/m.exec(specStrip(text))?.[1]?.toLowerCase() ?? "";
}
