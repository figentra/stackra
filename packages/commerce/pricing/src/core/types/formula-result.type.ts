/**
 * Stackra file contract:
 * Purpose: `FormulaResult`, what `evaluateFormula` answers: the unit price and the rate snapshots its terms used.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: the MUS-216 answer; ADR 0337 (decision 3).
 */
import type { Money } from "@stackra/money";
import type { RateSnapshot } from "@stackra/money/contracts";

/** An evaluated formula. */
export interface FormulaResult {
  /** The unit price. */
  readonly amount: Money;

  /** The snapshots the rate terms priced with, once each. */
  readonly rates: readonly RateSnapshot[];
}
