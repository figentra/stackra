/**
 * Stackra file contract:
 * Purpose: `isWeightOrFault`, the guard a weight request accepts its answer with: a weight line or a fault line,
 *          never a tare.
 * Boundary: internal; pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decision 5).
 */
import type { ScaleLine } from "#core/types/scale-line.type";

/**
 * True for a weight or a fault.
 *
 * @example
 * await requestScaleLine(module, { ...request, accept: isWeightOrFault });
 */
export function isWeightOrFault(
  line: ScaleLine,
): line is Extract<ScaleLine, { kind: "weight" | "fault" }> {
  return line.kind !== "tare";
}
