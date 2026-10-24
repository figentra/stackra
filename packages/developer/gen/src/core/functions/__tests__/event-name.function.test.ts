/**
 * Stackra file contract:
 * Purpose: unit tests of `eventName`: an integration event carries `.v<n>`, a domain event none.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0141 as amended by 0294.
 */
import { describe, expect, it } from "@stackra/testing";

import { eventName } from "#core/functions/event-name.function";

describe("eventName", () => {
  it("versions integration events only", () => {
    expect(eventName("orders", "order.paid", 1)).toBe("orders.order.paid.v1");
    expect(eventName("orders", "order.paid", 2)).toBe("orders.order.paid.v2");
    expect(eventName("loyalty_kit", "points.redeemed")).toBe("loyalty_kit.points.redeemed");
  });
});
