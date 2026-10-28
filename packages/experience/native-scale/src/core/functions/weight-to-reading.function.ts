/**
 * Stackra file contract:
 * Purpose: `weightToReading`, the `ScaleReading` of the `Scale` port derived from a parsed weight line: its grams and
 *          its stable flag, nothing else, so the port's type stays unchanged (ADR 0478 decision 5).
 * Boundary: internal; pure. A reading is only ever built from a line a scale sent.
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decision 5); ADR 0253.
 */
import type { ScaleReading } from "@stackra/peripherals/contracts";

import type { ScaleLine } from "#core/types/scale-line.type";

/**
 * The port's reading.
 *
 * @example
 * weightToReading({ kind: "weight", value: 1.25, unit: "kg", grams: 1250, isStable: true, isNet: null }); // { grams: 1250, isStable: true }
 */
export function weightToReading(line: Extract<ScaleLine, { kind: "weight" }>): ScaleReading {
  return { grams: line.grams, isStable: line.isStable };
}
