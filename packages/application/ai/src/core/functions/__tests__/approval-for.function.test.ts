/**
 * Stackra file contract:
 * Purpose: unit and type tests of `approvalFor`: no approval at L0 and L1, the user's confirmation at L2, a named human
 *          approver at L3 and L4, and a `RangeError` for any other text.
 * Boundary: test only; the levels are the template's generated tool table (`orders.order.cancel@1` at L2).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0100 (decision 5); ADR 0099 (decision 1).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Approval } from "#core/enums/approval.enum";
import { approvalFor } from "#core/functions/approval-for.function";

describe("approvalFor", () => {
  it("lets reads run and gates writes by level", () => {
    expect(approvalFor("L0")).toBeUndefined();
    expect(approvalFor("L1")).toBeUndefined();
    expect(approvalFor("L2")).toBe(Approval.Confirm);
    expect(approvalFor("L3")).toBe(Approval.NamedApprover);
    expect(approvalFor("L4")).toBe(Approval.NamedApprover);
  });

  it("refuses anything but L0 to L4", () => {
    for (const risk of ["L5", "l2", "2", "", " L2", "L2 ", "R2"])
      expect(() => approvalFor(risk)).toThrow(RangeError);
  });

  it("types its result", () => {
    expectTypeOf(approvalFor("L2")).toEqualTypeOf<Approval | undefined>();
  });
});
