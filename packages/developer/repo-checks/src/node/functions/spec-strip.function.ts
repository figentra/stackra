/**
 * Stackra file contract:
 * Purpose: `specStrip(text)`, a spec artifact without its HTML comments, which hold template guidance, never content.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0120 (SDLC spec location, lanes and change risk); ADR 0198; ADR 0282 (decision 3). Loaded by
 *                     plain Node from source by core's `tools/scripts` wrappers, so it imports values by relative
 *                     `.ts` paths and uses erasable TypeScript only (ADR 0421 decision 2).
 */

/**
 * The text without HTML comments.
 *
 * @param text - a spec.md, plan.md or tasks.md.
 * @example
 * specStrip("a <!-- note --> b"); // "a  b"
 */
export function specStrip(text: string): string {
  return text.replaceAll(/<!--[\s\S]*?-->/g, "");
}
