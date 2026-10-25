/**
 * Stackra file contract:
 * Purpose: type tests of `ErrorCategory`: exactly the ten category names of ADR 0140, read from `ErrorKind`, so
 *          `failed_precondition` is not one and `precondition_failed` is.
 * Boundary: test only; types are checked by `expectTypeOf`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0140 (decision 2).
 */
import { describe, expectTypeOf, it } from "@stackra/testing";

import type { ErrorCategory } from "#core/types/error-category.type";

describe("ErrorCategory", () => {
  it("is the ten categories of ADR 0140", () => {
    expectTypeOf<ErrorCategory>().toEqualTypeOf<
      | "validation"
      | "unauthenticated"
      | "entitlement_required"
      | "forbidden"
      | "not_found"
      | "conflict"
      | "precondition_failed"
      | "rate_limited"
      | "unavailable"
      | "internal"
    >();
  });
});
