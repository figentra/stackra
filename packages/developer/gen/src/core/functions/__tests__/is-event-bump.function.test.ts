/**
 * Stackra file contract:
 * Purpose: unit tests of `isEventBump`: the same stem at a higher version is a bump; a lower or equal version, another
 *          stem or an unversioned name is not.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0305 (rule 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { isEventBump } from "#core/functions/is-event-bump.function";

describe("isEventBump", () => {
  it("accepts only the same stem at a higher version", () => {
    expect(isEventBump("orders.order.paid.v1", "orders.order.paid.v2")).toBe(true);
    expect(isEventBump("orders.order.paid.v2", "orders.order.paid.v10")).toBe(true);
    expect(isEventBump("orders.order.paid.v2", "orders.order.paid.v1")).toBe(false);
    expect(isEventBump("orders.order.paid.v1", "orders.order.paid.v1")).toBe(false);
    expect(isEventBump("orders.order.paid.v1", "orders.order.voided.v2")).toBe(false);
    expect(isEventBump("orders.order.paid", "orders.order.paid.v2")).toBe(false);
  });
});
