/**
 * Stackra file contract:
 * Purpose: `Decision`, what `decide` answers for one rule: whether it matched, the explained evaluation, the outcomes a
 *          match yields after the floor guard, and each parameter the guard lifted.
 * Boundary: a type only, and a result only: `OutcomeDispatcher` hands the outcomes to the consumer's handlers. No
 *           outcome leaves `decide` without the floor guard, so a dispatched outcome never crosses a market floor.
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decisions 7 and 9); config-model section 4 (the floor is the final guard).
 */
import type { Evaluation } from "#core/types/evaluation.type";
import type { FlooredParam } from "#core/types/floored-param.type";
import type { Outcome } from "#core/types/outcome.type";

/** One rule's decision. */
export interface Decision {
  /** Whether the condition held. */
  readonly matched: boolean;

  /** The evaluation, explained by tree path. */
  readonly evaluation: Evaluation;

  /** The guarded outcomes; empty when the condition did not hold. */
  readonly outcomes: readonly Outcome[];

  /** The parameters the floor guard changed. */
  readonly floored: readonly FlooredParam[];
}
