/**
 * Stackra file contract:
 * Purpose: unit and type tests of `ApprovalMode`: an `Enum.of` enum holding the five approval modes of ADR 0360
 *          decision 6, codes in source order, with a same-named type.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0360 (decision 6); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { ApprovalMode } from "#core/enums/approval-mode.enum";

describe("ApprovalMode", () => {
  it("holds its snake_case codes in order", () => {
    expect(Enum.values(ApprovalMode)).toEqual([
      "ask",
      "allow_by_default",
      "always_allow",
      "bypass",
      "escalate",
    ]);
  });

  it("types its values", () => {
    expectTypeOf<ApprovalMode>().toEqualTypeOf<
      "ask" | "allow_by_default" | "always_allow" | "bypass" | "escalate"
    >();
  });
});
