/**
 * Stackra file contract:
 * Purpose: unit and type tests of `ReviewState`: an `Enum.of` enum of the seven review states, codes in source order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0355 (decision 8).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { ReviewState } from "#core/enums/review-state.enum";

describe("ReviewState", () => {
  it("holds its snake_case codes in order", () => {
    expect(Enum.values(ReviewState)).toEqual([
      "draft",
      "submitted",
      "in_review",
      "changes_requested",
      "approved",
      "rejected",
      "suspended",
    ]);
  });

  it("types its values", () => {
    expectTypeOf<ReviewState>().toEqualTypeOf<
      | "draft"
      | "submitted"
      | "in_review"
      | "changes_requested"
      | "approved"
      | "rejected"
      | "suspended"
    >();
  });
});
