/**
 * Stackra file contract:
 * Purpose: type tests of `BusinessDayResult`: its fields resolve to the documented types.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0366.
 */
import { describe, expectTypeOf, it } from "@stackra/testing";

import type { BusinessDayResult } from "#core/types/business-day-result.type";

describe("BusinessDayResult", () => {
  it("resolves its fields", () => {
    expectTypeOf<BusinessDayResult>().toEqualTypeOf<{
      readonly date: string;
      readonly uncertain: readonly string[];
    }>();
  });
});
