/**
 * Stackra file contract:
 * Purpose: `canTransitionReview(from, to)`, whether a review may move from one state to another.
 * Boundary: pure; never throws: an unknown state on either side is `false`, so untrusted input is refused, not raised.
 * Runtime: isomorphic
 * Governing contract: ADR 0355 (decision 8).
 */
import { REVIEW_TRANSITIONS } from "#core/constants/review-transitions.constant";
import type { ReviewState } from "#core/enums/review-state.enum";

/**
 * Whether `from` may move to `to`.
 *
 * @example
 * canTransitionReview("approved", "draft"); // false
 */
export function canTransitionReview(from: ReviewState | string, to: ReviewState | string): boolean {
  return (
    Object.hasOwn(REVIEW_TRANSITIONS, from) &&
    (REVIEW_TRANSITIONS[from as ReviewState] as readonly string[]).includes(to)
  );
}
