/**
 * Stackra file contract:
 * Purpose: unit tests of `Drill.resource`: a frozen drill node to a resource, with its filter and view.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rule 15).
 */
import { describe, expect, it } from "@stackra/testing";

import { Bind } from "#core/constants/bind.constant";
import { Drill } from "#core/constants/drill.constant";

class OrderResource {}

describe("Drill", () => {
  it("builds a frozen drill node", () => {
    const drill = Drill.resource(OrderResource, {
      filter: { paidAt: Bind.range() },
      view: "paid",
    } as never);
    expect(drill).toEqual({
      kind: "resource",
      resource: OrderResource,
      view: "paid",
      filter: { paidAt: "range" },
    });
    expect(Drill.resource(OrderResource)).toEqual({ kind: "resource", resource: OrderResource });
    expect(Object.isFrozen(drill)).toBe(true);
  });
});
