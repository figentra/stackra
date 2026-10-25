/**
 * Stackra file contract:
 * Purpose: `Evaluation`, the result of one evaluation: whether the condition matched, the revision it ran against, and
 *          the explanation of every node by its path.
 * Boundary: a type only, and a result only: what a match does belongs to the consumer (ADR 0331 decision 9). Every
 *           node is evaluated, so the steps explain each failed leaf, not only the first; they are in tree order,
 *           the root first.
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decisions 5, 7 and 9).
 */
import type { EvaluationStep } from "#core/types/evaluation-step.type";

/** One evaluation's result. */
export interface Evaluation {
  /** Whether the root condition held. */
  readonly matched: boolean;

  /** The rule set revision evaluated; null for a condition that is not a stored revision (a builder's preview). */
  readonly revision: number | null;

  /** Every node's step, the root first, in tree order. */
  readonly steps: readonly EvaluationStep[];
}
