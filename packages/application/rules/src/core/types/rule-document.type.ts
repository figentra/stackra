/**
 * Stackra file contract:
 * Purpose: `RuleDocument`, the content of one rule: the condition it tests and the outcomes a match yields, as a rule
 *          set revision stores it and `decide` reads it.
 * Boundary: a type only; data that references registered fields and outcome kinds, never code (ADR 0331 decision 10).
 *           A rule with no outcomes is a plain test (a segment's membership, a visibility rule).
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decisions 2, 5 and 9).
 */
import type { Condition } from "#core/types/condition.type";
import type { Outcome } from "#core/types/outcome.type";

/** One rule's content. */
export interface RuleDocument {
  /** The condition tree. */
  readonly condition: Condition;

  /** What a match yields, in the order the consumer applies them. */
  readonly outcomes: readonly Outcome[];
}
