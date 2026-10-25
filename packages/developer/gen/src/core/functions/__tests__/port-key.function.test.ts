/**
 * Stackra file contract:
 * Purpose: unit tests of `portKey`: the declaring member's key and the port class name.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 26: the registry is keyed by port key).
 */
import { describe, expect, it } from "@stackra/testing";

import { portKey } from "#core/functions/port-key.function";

describe("portKey", () => {
  it("joins the member key and the port name", () => {
    expect(portKey("loyalty_kit", "LoyaltyLedger")).toBe("loyalty_kit.LoyaltyLedger");
  });
});
