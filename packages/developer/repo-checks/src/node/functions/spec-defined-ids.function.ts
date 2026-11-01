/**
 * Stackra file contract:
 * Purpose: `specDefinedIds(text, prefix)`, the IDs a spec defines as `- **FR-001**: …`, split into live and struck.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0120 (SDLC spec location, lanes and change risk); ADR 0198; ADR 0282 (decision 3). Loaded by
 *                     plain Node from source by core's `tools/scripts` wrappers, so it imports values by relative
 *                     `.ts` paths and uses erasable TypeScript only (ADR 0421 decision 2).
 */
import { specStrip } from "./spec-strip.function.ts";

/**
 * The defined IDs, live and struck (`~~FR-001~~`, amendments).
 *
 * @param text - the spec or plan text.
 * @param prefix - the ID prefix as regex source (`FR`, `(?:FR|SC|EC)`).
 * @example
 * specDefinedIds("- **FR-001**: x", "FR").live; // Set { "FR-001" }
 */
export function specDefinedIds(
  text: string,
  prefix: string,
): { live: Set<string>; struck: Set<string> } {
  const live = new Set<string>();
  const struck = new Set<string>();
  const re = new RegExp(`^\\s*[-*] (~~)?\\*\\*(${prefix}-\\d+)\\*\\*(~~)?(.*)$`, "gm");
  for (const m of specStrip(text).matchAll(re)) {
    const id = m[2] ?? "";
    if (m[1] || m[3] || /^\s*~~/.test(m[4] ?? "")) struck.add(id);
    else live.add(id);
  }
  return { live, struck };
}
