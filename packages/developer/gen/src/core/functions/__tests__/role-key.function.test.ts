/**
 * Stackra file contract:
 * Purpose: unit tests of `roleKey`: the module, then the class name without `Role` in snake_case.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0208 (decision 2); STA-1710.
 */
import { describe, expect, it } from "@stackra/testing";

import { roleKey } from "#core/functions/role-key.function";

describe("roleKey", () => {
  it("derives <module>.<snake name without Role>", () => {
    expect(roleKey("orders", "OrderClerkRole")).toBe("orders.order_clerk");
    expect(roleKey("records_kit", "Nurse")).toBe("records_kit.nurse");
  });
});
