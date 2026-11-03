/**
 * Stackra file contract:
 * Purpose: `DitherBand`, the dither art a landing block stands on (the hero's horizon, the try-it band): its posters,
 *          its brand pattern and its sun.
 * Boundary: a shape class only, the field type of the landing blocks; gen compiles it with them. The component sets
 *           the colours and the fade from token roles; a document never does.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0305 (one declaration per file); ADR 0302 (decision 3); STA-2041.
 */
import type { DitherPattern } from "@stackra/ui/contracts";
import { Schema } from "@stackra/validation";

import type { DitherSunPoint } from "#core/schemas/dither-sun-point.schema";
import type { SchemePoster } from "#core/schemas/scheme-poster.schema";

/** A dither band. */
export class DitherBand extends Schema {
  poster!: SchemePoster;

  /** The brand pattern; `strata` when absent. */
  pattern?: DitherPattern;

  /** The core glow; the pattern's own when absent. */
  sun?: DitherSunPoint;
}
