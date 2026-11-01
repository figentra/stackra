/**
 * Stackra file contract:
 * Purpose: `specImpactOf(spec)`, the text of a spec's `## Impact` section.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0120 (SDLC spec location, lanes and change risk); ADR 0198; ADR 0282 (decision 3). Loaded by
 *                     plain Node from source by core's `tools/scripts` wrappers, so it imports values by relative
 *                     `.ts` paths and uses erasable TypeScript only (ADR 0421 decision 2).
 */
import { specStrip } from "./spec-strip.function.ts";

/**
 * The Impact section body; `""` when the section is missing.
 *
 * @param spec - the spec.md text.
 * @example
 * specImpactOf("## Impact\n- **Lane**: lite\n## Next"); // "- **Lane**: lite\n"
 */
export function specImpactOf(spec: string): string {
  return /^## Impact\b[^\n]*\n([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(specStrip(spec))?.[1] ?? "";
}
