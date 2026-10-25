/**
 * Stackra file contract:
 * Purpose: `dueEscalations(steps, state, now)`, the escalation steps to run now for a notification that needs an
 *          acknowledgement: none once someone acknowledged it, otherwise every step not yet run whose delay has passed.
 * Boundary: pure. The steps are rules data (OS-199); the caller runs the steps returned, then stores `escalated`
 *           increased by their count.
 * Runtime: isomorphic
 * Governing contract: OS-199; row "acknowledgement and escalation" of the package needs (2026-10-25).
 */
import type { EscalationState } from "#contracts/types/escalation-state.type";
import type { EscalationStep } from "#contracts/types/escalation-step.type";

/**
 * The steps due at `now`, in order.
 *
 * @example
 * const due = dueEscalations(policy.steps, state, ctx.now());
 * await Promise.all(due.map(runStep));
 * await save({ ...state, escalated: state.escalated + due.length });
 */
export function dueEscalations(
  steps: readonly EscalationStep[],
  state: EscalationState,
  now: Date,
): readonly EscalationStep[] {
  if (state.acknowledgedAt !== undefined) return [];
  const elapsed = (now.getTime() - state.sentAt.getTime()) / 1000;
  const ordered = [...steps].sort((a, b) => a.afterSeconds - b.afterSeconds);
  return ordered.slice(state.escalated).filter((step) => step.afterSeconds <= elapsed);
}
