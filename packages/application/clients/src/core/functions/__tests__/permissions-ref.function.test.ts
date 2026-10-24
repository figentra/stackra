/**
 * Stackra file contract:
 * Purpose: unit and type tests of `permissionsRef`: one static per verb holding the full permission, the prefix, the
 *          refused prefix and verb, and the literal permission types.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 20); owner decision R-56.
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { permissionsRef } from "#core/functions/permissions-ref.function";

class OrderPermissions extends permissionsRef("orders.order", ["create", "read", "cancel"]) {}

describe("permissionsRef", () => {
  it("holds each verb's full permission as a static", () => {
    expect(OrderPermissions.read).toBe("orders.order.read");
    expect(OrderPermissions.cancel).toBe("orders.order.cancel");
    expect(OrderPermissions.create).toBe("orders.order.create");
    expect(OrderPermissions.prefix).toBe("orders.order");
  });

  it("refuses a prefix without a model and a verb that is not snake_case", () => {
    expect(() => permissionsRef("orders", ["read"])).toThrow(RangeError);
    expect(() => permissionsRef("orders.order", ["Read"])).toThrow(RangeError);
  });

  it("types each permission as its literal", () => {
    expectTypeOf(OrderPermissions.read).toEqualTypeOf<"orders.order.read">();
  });
});
