/**
 * Stackra file contract:
 * Purpose: unit tests of `GrantRefusal`: exactly the seven refusal codes, typed as their union.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0368 (decision 3).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { GrantRefusal } from "#contracts/enums/grant-refusal.enum";

describe("GrantRefusal", () => {
  it("has the seven refusal codes", () => {
    expect(Enum.values(GrantRefusal)).toEqual([
      "kind_archived",
      "recipient_mismatch",
      "level_required",
      "level_unknown",
      "level_not_higher",
      "period_required",
      "period_taken",
    ]);
    expect(GrantRefusal.PeriodTaken).toBe("period_taken");
    expectTypeOf<GrantRefusal>().toEqualTypeOf<
      | "kind_archived"
      | "recipient_mismatch"
      | "level_required"
      | "level_unknown"
      | "level_not_higher"
      | "period_required"
      | "period_taken"
    >();
  });
});
