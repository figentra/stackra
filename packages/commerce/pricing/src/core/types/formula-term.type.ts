/**
 * Stackra file contract:
 * Purpose: `FormulaTerm`, one addend of a price formula: either a rate term (the day's metal rate times the item's
 *          weight and purity) or an amount term (a making charge per gram, a fixed stone price), each multiplied by
 *          named inputs and a constant factor.
 * Boundary: a type only; tenant data from the catalogue or the market pack's default formulas, never a formula in
 *           code. Exactly one of `rate` and `amount` is set; `evaluateFormula` checks it.
 * Runtime: isomorphic
 * Governing contract: the MUS-216 answer (price from formula); ADR 0220 (decision 3: a rate snapshot per cart).
 */
import type { Money } from "@stackra/money";
import type { RatePair } from "@stackra/money/contracts";

/** One addend of a formula. */
export interface FormulaTerm {
  /** The rate this term prices by, matched against the query's rate snapshots; null for an amount term. */
  readonly rate: RatePair | null;

  /** The amount this term charges per unit of its inputs; null for a rate term. */
  readonly amount: Money | null;

  /** Names of the query inputs multiplied in (`["weight_grams", "purity"]`); empty for a flat term. */
  readonly inputs: readonly string[];

  /** A constant factor, as a decimal string (`"1"`, `"0.75"`). */
  readonly factor: string;
}
