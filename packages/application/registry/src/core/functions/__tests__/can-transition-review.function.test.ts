/**
 * Stackra file contract:
 * Purpose: unit tests of `canTransitionReview`: the review path from draft to approved, changes requested back to
 *          submitted, suspension and re-review, rejection as final, and unknown states refused without throwing.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0355 (decision 8).
 */
import { describe, expect, it } from "@stackra/testing";

import { ReviewState } from "#core/enums/review-state.enum";
import { canTransitionReview } from "#core/functions/can-transition-review.function";

describe("canTransitionReview", () => {
  it("walks a version from draft to approved", () => {
    expect(canTransitionReview(ReviewState.Draft, ReviewState.Submitted)).toBe(true);
    expect(canTransitionReview(ReviewState.Submitted, ReviewState.InReview)).toBe(true);
    expect(canTransitionReview(ReviewState.InReview, ReviewState.Approved)).toBe(true);
  });

  it("sends changes back, suspends and re-reviews", () => {
    expect(canTransitionReview(ReviewState.InReview, ReviewState.ChangesRequested)).toBe(true);
    expect(canTransitionReview(ReviewState.ChangesRequested, ReviewState.Submitted)).toBe(true);
    expect(canTransitionReview(ReviewState.Approved, ReviewState.Suspended)).toBe(true);
    expect(canTransitionReview(ReviewState.Suspended, ReviewState.InReview)).toBe(true);
  });

  it("refuses skipped steps, a final rejection and unknown states", () => {
    expect(canTransitionReview(ReviewState.Draft, ReviewState.Approved)).toBe(false);
    expect(canTransitionReview(ReviewState.Suspended, ReviewState.Approved)).toBe(false);
    expect(canTransitionReview(ReviewState.Rejected, ReviewState.Submitted)).toBe(false);
    expect(canTransitionReview("toString", ReviewState.Draft)).toBe(false);
    expect(canTransitionReview(ReviewState.Draft, "listed")).toBe(false);
  });
});
