/**
 * Stackra file contract:
 * Purpose: `specDefinedLines(text, prefix)`, each defined ID of a spec with the rest of its line.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0120 (SDLC spec location, lanes and change risk); ADR 0198; ADR 0282 (decision 3). Loaded by
 *                     plain Node from source by core's `tools/scripts` wrappers, so it imports values by relative
 *                     `.ts` paths and uses erasable TypeScript only (ADR 0421 decision 2).
 */
import { specStrip } from "./spec-strip.function.ts";

/**
 * `- **FR-001**: rest` as a map from the ID to `rest`, struck or not.
 *
 * @param text - the spec or plan text.
 * @param prefix - the ID prefix as regex source.
 * @example
 * specDefinedLines("- **FR-001**: a", "FR").get("FR-001"); // ": a"
 */
export function specDefinedLines(text: string, prefix: string): Map<string, string> {
  const out = new Map<string, string>();
  const re = new RegExp(`^\\s*[-*] (?:~~)?\\*\\*(${prefix}-\\d+)\\*\\*(?:~~)?(.*)$`, "gm");
  for (const m of specStrip(text).matchAll(re)) out.set(m[1] ?? "", m[2] ?? "");
  return out;
}
