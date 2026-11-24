/**
 * Stackra file contract:
 * Purpose: `ShowcaseMiss`, one registry entry and what its web showcase lacks.
 * Boundary: a type; `findShowcaseMisses` produces it.
 * Runtime: node
 * Governing contract: STA-2738 (the `showcase:coverage` script), a child of STA-2705.
 */
import type { ShowcaseGap } from "./showcase-gap.type.ts";

/** One entry (`<tier>/<slug>`) with at least one gap. */
export interface ShowcaseMiss {
  readonly key: string;
  readonly gaps: readonly ShowcaseGap[];
}
