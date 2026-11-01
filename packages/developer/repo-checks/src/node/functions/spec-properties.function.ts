/**
 * Stackra file contract:
 * Purpose: `specProperties(plan)`, the properties of a plan.md (`P-001 … Validates: FR-001`) with the FRs each validates.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0120 (SDLC spec location, lanes and change risk); ADR 0198; ADR 0282 (decision 3). Loaded by
 *                     plain Node from source by core's `tools/scripts` wrappers, so it imports values by relative
 *                     `.ts` paths and uses erasable TypeScript only (ADR 0421 decision 2).
 */
import { specDefinedLines } from "./spec-defined-lines.function.ts";

/**
 * Each P-### with the FR ids on its `Validates:` list.
 *
 * @param plan - the plan.md text.
 * @example
 * specProperties("- **P-001**: x Validates: FR-001").get("P-001"); // ["FR-001"]
 */
export function specProperties(plan: string): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const [id, rest] of specDefinedLines(plan, "P")) {
    const validates = /Validates:\s*(.*)$/i.exec(rest)?.[1] ?? "";
    out.set(
      id,
      [...validates.matchAll(/\bFR-\d+\b/g)].map((m) => m[0]),
    );
  }
  return out;
}
