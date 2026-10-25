/**
 * Stackra file contract:
 * Purpose: `REVIEW_TRANSITIONS`, the states each review state may move to.
 * Boundary: internal; `canTransitionReview` reads it. A rejected version is final: a fix is a new version with a new
 *           review. A suspended version goes back through review before it is listed again.
 * Runtime: isomorphic
 * Governing contract: ADR 0355 (decision 8).
 */
import { ReviewState } from "#core/enums/review-state.enum";

/** From → the states it may move to. */
export const REVIEW_TRANSITIONS: Readonly<Record<ReviewState, readonly ReviewState[]>> =
  Object.freeze({
    [ReviewState.Draft]: [ReviewState.Submitted],
    [ReviewState.Submitted]: [ReviewState.InReview, ReviewState.Draft],
    [ReviewState.InReview]: [
      ReviewState.Approved,
      ReviewState.ChangesRequested,
      ReviewState.Rejected,
    ],
    [ReviewState.ChangesRequested]: [ReviewState.Submitted, ReviewState.Draft],
    [ReviewState.Approved]: [ReviewState.Suspended],
    [ReviewState.Rejected]: [],
    [ReviewState.Suspended]: [ReviewState.InReview],
  });
