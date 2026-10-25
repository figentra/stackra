/**
 * Stackra file contract:
 * Purpose: `BudgetCheck`, what `checkBudget` answers: whether the run may start, whether to warn, and what remains.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0156 (decision 4).
 */

/** The answer of one budget check. */
export interface BudgetCheck {
  /** Whether the requested tokens fit in what remains. */
  readonly allowed: boolean;

  /** Whether usage after the run reaches the warning share. */
  readonly warn: boolean;

  /** The tokens left before the run. */
  readonly remaining: number;
}
