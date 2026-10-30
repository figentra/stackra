/**
 * Stackra file contract:
 * Purpose: the props every runtime's `CoachMark` takes: the tour's steps, its open state and `onFinish`, told whether
 *          the tour was done or skipped.
 * Boundary: types only. The step counter and the Back, Next, Done and Skip words are the `ui` catalogue's.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); GAPS.md row 39 (owner decision 2026-10-28); WCAG 2.2 SC 2.1.1 and
 *          2.4.3.
 */
import type { CoachMarkOutcome } from "#contracts/enums/coach-mark-outcome.enum";
import type { CoachMarkStep } from "#contracts/types/coach-mark-step.type";
import type { OpenStateContractProps } from "#contracts/types/open-state-contract-props.type";

/** Props shared by the web and native CoachMark; `TTarget` is the runtime's element type. */
export interface CoachMarkContractProps<TTarget> extends OpenStateContractProps {
  /** The stops, in order; each target must be mounted and on screen while its step shows. */
  readonly steps: readonly CoachMarkStep<TTarget>[];
  /** Called once when the tour closes: `done` after the last step, `skipped` before it. */
  readonly onFinish?: ((outcome: CoachMarkOutcome) => void) | undefined;
}
