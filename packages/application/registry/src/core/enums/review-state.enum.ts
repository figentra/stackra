/**
 * Stackra file contract:
 * Purpose: `ReviewState`, where an app version stands in the app market's review: a draft, submitted, in review, sent
 *          back for changes, approved (listable), rejected, or suspended after approval.
 * Boundary: an enum (`Enum.of`). The moves between states are `canTransitionReview`'s; who may make them, the review
 *           rules and the queue are the registry service's and Figentra's (OS ADR 0037).
 * Runtime: isomorphic
 * Governing contract: ADR 0355 (decision 8: a review step approves an app before it is listed; the registry carries
 *                     the review state).
 */
import { Enum } from "@stackra/contracts";

/**
 * A review state.
 *
 * @example
 * canTransitionReview(ReviewState.InReview, ReviewState.Approved); // true
 */
export const ReviewState = Enum.of({
  /** Being prepared by the developer; not in the queue. */
  Draft: "draft",
  /** Sent to the review queue. */
  Submitted: "submitted",
  /** Taken by a reviewer. */
  InReview: "in_review",
  /** Sent back to the developer with notes. */
  ChangesRequested: "changes_requested",
  /** Approved: the version may be listed. */
  Approved: "approved",
  /** Refused; a new version starts a new review. */
  Rejected: "rejected",
  /** Withdrawn from the market after approval, pending a new review. */
  Suspended: "suspended",
});

/** One of the codes above. */
export type ReviewState = Enum.Value<typeof ReviewState>;
