/**
 * Stackra file contract:
 * Purpose: unit tests of `AppReview`: the shipped schema is registered, a review parses with the reviewer and notes
 *          defaulted, and an unknown state fails.
 * Boundary: test only; validates through @stackra/validation.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0355 (decision 8).
 */
import { describe, expect, it } from "@stackra/testing";
import { schemaOf, validate } from "@stackra/validation";

import { APP_REVIEW_SCHEMA } from "#core/constants/app-review-schema.constant";
import { AppReview } from "#core/schemas/app-review.schema";

describe("AppReview", () => {
  it("registers the shipped schema and defaults the reviewer and notes", () => {
    expect(schemaOf(AppReview)).toBe(APP_REVIEW_SCHEMA);
    const result = validate(AppReview, {
      app: "acme.loyalty",
      version: "1.2.0",
      state: "submitted",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toMatchObject({ reviewer: null, notes: null });
  });

  it("refuses an unknown state", () => {
    expect(validate(AppReview, { app: "a", version: "1", state: "listed" }).success).toBe(false);
  });
});
