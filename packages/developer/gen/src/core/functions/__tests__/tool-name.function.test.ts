/**
 * Stackra file contract:
 * Purpose: unit tests of `toolName`: the identity without its version, dots as underscores.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0305 (rule 28).
 */
import { describe, expect, it } from "@stackra/testing";

import { toolName } from "#core/functions/tool-name.function";

describe("toolName", () => {
  it("drops the version and replaces dots", () => {
    expect(toolName("orders.order.create@1")).toBe("orders_order_create");
    expect(toolName("loyalty_kit.balance.get@12")).toBe("loyalty_kit_balance_get");
  });
});
