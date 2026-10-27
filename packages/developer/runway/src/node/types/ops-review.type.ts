/**
 * Stackra file contract:
 * Purpose: `OpsReview`, who wrote an ops contribution change and who approved it.
 * Boundary: type only; the deploy workflow reads it from the pull request's reviews, `checkOpsReview` counts it.
 *           Handles are compared as given (case-insensitive).
 * Runtime: node
 * Governing contract: app-shells 16 (point 7: every ops contribution passes a second-reviewer gate in Runway).
 */

/** The review of a change. */
export type OpsReview = {
  /** The change's author. */
  readonly author: string;
  /** Everyone who approved it. */
  readonly approvals: readonly string[];
};
