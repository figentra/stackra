/**
 * Stackra file contract:
 * Purpose: unit tests of `coversPermission`: the same key, the whole wildcard and a prefix wildcard cover; another
 *          key and a prefix that is not a whole segment do not.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0132 (decisions 2 and 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { coversPermission } from "#core/functions/covers-permission.function";

describe("coversPermission", () => {
  it("covers the same key, the whole wildcard and a prefix wildcard", () => {
    expect(coversPermission("orders.order.cancel", "orders.order.cancel")).toBe(true);
    expect(coversPermission("*", "orders.order.cancel")).toBe(true);
    expect(coversPermission("orders.*", "orders.order.cancel")).toBe(true);
    expect(coversPermission("orders.order.*", "orders.order.cancel")).toBe(true);
  });

  it("does not cover another key or a partial segment", () => {
    expect(coversPermission("orders.order.read", "orders.order.cancel")).toBe(false);
    expect(coversPermission("orders.*", "orders_kit.order.read")).toBe(false);
    expect(coversPermission("orders", "orders.order.read")).toBe(false);
  });
});
