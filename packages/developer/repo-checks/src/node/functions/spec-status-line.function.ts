/**
 * Stackra file contract:
 * Purpose: `specStatusLine(text)`, the whole `**Status**:` line of a spec, to compare two versions of it.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0120 (SDLC spec location, lanes and change risk); ADR 0198; ADR 0282 (decision 3). Loaded by
 *                     plain Node from source by core's `tools/scripts` wrappers, so it imports values by relative
 *                     `.ts` paths and uses erasable TypeScript only (ADR 0421 decision 2).
 */
import { specStrip } from "./spec-strip.function.ts";

/**
 * The status line, trimmed; `""` when absent.
 *
 * @param text - the spec.md text.
 * @example
 * specStatusLine("# X\n**Status**: Draft \n"); // "**Status**: Draft"
 */
export function specStatusLine(text: string): string {
  return /^\*\*Status\*\*:.*$/m.exec(specStrip(text))?.[0].trim() ?? "";
}
