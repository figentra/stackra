/**
 * Stackra file contract:
 * Purpose: `PriceFormula`, the unit price of a formula-priced item: the sum of its terms, each rounded once with the
 *          formula's rounding.
 * Boundary: a type only; data. `evaluateFormula` computes it from the query's inputs and rate snapshots.
 * Runtime: isomorphic
 * Governing contract: the MUS-216 answer; ADR 0220 (decision 3: one explicit rounding).
 */
import type { Rounding } from "@stackra/contracts";

import type { FormulaTerm } from "#core/types/formula-term.type";

/** A unit price as a sum of terms. */
export interface PriceFormula {
  /** The addends, at least one. */
  readonly terms: readonly FormulaTerm[];

  /** How each term rounds to minor units. */
  readonly rounding: Rounding;
}
