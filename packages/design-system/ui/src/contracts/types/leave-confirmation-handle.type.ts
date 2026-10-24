/**
 * Stackra file contract:
 * Purpose: what a `LeaveConfirmation` hands its `ref`: `confirmLeave`, the question a router blocker or a cancel
 *          button asks before the user walks away from unsaved work.
 * Boundary: types only. The component knows nothing of routers; the app's navigation code calls this.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0312; WCAG 2.2 SC 3.3.4.
 */

/** The imperative handle of a `LeaveConfirmation`. */
export interface LeaveConfirmationHandle {
  /**
   * Asks whether the user may leave. It resolves true at once when nothing is unsaved (`when` is false), and
   * otherwise opens the dialog and resolves true if the user discards their changes, false if they stay.
   */
  readonly confirmLeave: () => Promise<boolean>;
}
