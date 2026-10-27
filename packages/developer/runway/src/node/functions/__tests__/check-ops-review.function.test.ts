/**
 * Stackra file contract:
 * Purpose: unit tests of `checkOpsReview`: one approval besides the author passes; the author's own approval, a
 *          repeated handle (any case) and a missing review do not count; a higher reviewer count applies.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); app-shells 16 (point 7).
 */
import { describe, expect, it } from "@stackra/testing";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { checkOpsReview } from "#node/functions/check-ops-review.function";

describe("checkOpsReview", () => {
  it("passes with a second reviewer", () => {
    expect(() => checkOpsReview({ author: "dana", approvals: ["sam"] })).not.toThrow();
  });

  it("does not count the author or a repeated handle", () => {
    expect(() => checkOpsReview({ author: "dana", approvals: ["Dana", "dana"] })).toThrow(
      RunwayInvalidError,
    );
    expect(() => checkOpsReview({ author: "dana", approvals: ["sam", "SAM"] }, 2)).toThrow(
      RunwayInvalidError,
    );
  });

  it("refuses a missing review", () => {
    expect(() => checkOpsReview(undefined)).toThrow(RunwayInvalidError);
  });

  it("takes a higher reviewer count", () => {
    expect(() => checkOpsReview({ author: "dana", approvals: ["sam", "lee"] }, 2)).not.toThrow();
  });
});
