/**
 * Stackra file contract:
 * Purpose: `DitherBand`, the dither art a landing block stands on (the hero's horizon, the try-it band): its posters,
 *          its brand pattern and its sun.
 * Boundary: a type only, the field type of the landing blocks. The component sets the colours and the fade from token
 *           roles; a document never does.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-2041.
 */
import type { DitherPattern } from "@stackra/ui/contracts";

import type { DitherSunPoint } from "#core/types/dither-sun-point.type";
import type { SchemePoster } from "#core/types/scheme-poster.type";

/** A dither band. */
export interface DitherBand {
  /** The posters shown until the canvas draws. */
  readonly poster: SchemePoster;

  /** The brand pattern; `strata` when absent. */
  readonly pattern?: DitherPattern;

  /** The core glow; the pattern's own when absent. */
  readonly sun?: DitherSunPoint;
}
