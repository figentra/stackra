/**
 * Stackra file contract:
 * Purpose: `isTareOrFault`, the guard a tare request accepts its answer with: a tare line or a fault line.
 * Boundary: internal; pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decision 5).
 */
import type { ScaleLine } from "#core/types/scale-line.type";

/**
 * True for a tare or a fault.
 *
 * @example
 * await requestScaleLine(module, { ...request, command: "TA", accept: isTareOrFault });
 */
export function isTareOrFault(
  line: ScaleLine,
): line is Extract<ScaleLine, { kind: "tare" | "fault" }> {
  return line.kind !== "weight";
}
