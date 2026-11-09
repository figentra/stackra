/**
 * Stackra file contract:
 * Purpose: `StepUpExemption`, the one `stepUp` value that is not an assurance level: `{ exempt:
 *          "first-factor-enrolment" }`, for the action that lets a user enrol their first strong factor (a first
 *          passkey), who has nothing to step up with yet (STA-340).
 * Boundary: a type only. The pipeline asks no `StepUpCheck` for it; the action enforces its own rule instead (a fresh
 *           session for the first factor, AAL2 once the user has a strong factor). Gen allows it only on the actions
 *           listed in its `FIRST_FACTOR_ENROLMENT_ACTIONS`, so it never becomes a general way out of step-up.
 * Runtime: isomorphic
 * Governing contract: ADR 0406 (amendment of 2026-11-07); STA-340.
 */

/** The narrow step-up exemption for first-factor enrolment. */
export interface StepUpExemption {
  /** The one reason an action may skip the pipeline's step-up: enrolling the user's first strong factor. */
  readonly exempt: "first-factor-enrolment";
}
