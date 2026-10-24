/**
 * Stackra file contract:
 * Purpose: unit tests of `actionKey`: the module key, the written key and the major version, 1 by default.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 20).
 */
import { describe, expect, it } from "@stackra/testing";

import { actionKey } from "#core/functions/action-key.function";

describe("actionKey", () => {
  it("prefixes the module and suffixes the major version", () => {
    expect(actionKey("orders", "order.cancel")).toBe("orders.order.cancel@1");
    expect(actionKey("orders", "order.cancel", 3)).toBe("orders.order.cancel@3");
  });
});
