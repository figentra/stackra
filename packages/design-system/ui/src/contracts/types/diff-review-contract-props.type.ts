/**
 * Stackra file contract:
 * Purpose: `DiffReviewContractProps`, the props of every runtime's `DiffReview`: a change set shown as before / after
 *          rows, each accepted or rejected, and an apply button once every change has an answer.
 * Boundary: types only. Controlled: the decisions are the caller's.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371.
 */
import type { DiffChange } from "#contracts/types/diff-change.type";
import type { DiffDecision } from "#contracts/types/diff-decision.type";

/** Props shared by the web and native `DiffReview`. */
export interface DiffReviewContractProps {
  /** The changes to review, in order. */
  readonly changes: readonly DiffChange[];
  /** The reviewer decision for each change, by change id. */
  readonly decisions: DiffDecision;
  /** Called with the new decisions when the reviewer accepts or rejects a change. */
  readonly onDecisionsChange: (decisions: DiffDecision) => void;
  /** Called with the decisions when the reviewer applies them. */
  readonly onApply?: ((decisions: DiffDecision) => void) | undefined;
  /** The review's accessible name, such as "Changes from the supplier feed". */
  readonly label: string;
}
