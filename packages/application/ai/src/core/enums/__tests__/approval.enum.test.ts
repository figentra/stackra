/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Approval`: an `Enum.of` enum holding the two human gates of ADR 0100 decision 5,
 *          codes in source order, with a same-named type.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0100 (decision 5); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Approval } from "#core/enums/approval.enum";

describe("Approval", () => {
  it("holds its snake_case codes in order", () => {
    expect(Enum.values(Approval)).toEqual(["confirm", "named_approver"]);
    expect(Approval.Confirm).toBe("confirm");
    expect(Approval.NamedApprover).toBe("named_approver");
  });

  it("types its values", () => {
    expectTypeOf<Approval>().toEqualTypeOf<"confirm" | "named_approver">();
  });
});
