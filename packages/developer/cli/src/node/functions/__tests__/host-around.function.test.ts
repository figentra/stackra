/**
 * Stackra file contract:
 * Purpose: unit tests of `hostAround`: the only host, else the deepest host whose folder holds the working directory,
 *          else none (the CLI asks), and a sibling folder sharing a name prefix is not inside.
 * Boundary: test only; pure paths.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-2888.
 */
import { describe, expect, it } from "@stackra/testing";

import { hostAround } from "#node/functions/host-around.function";

const orders = { root: "/repo/services/orders", label: "services/orders" };
const ordersAdmin = { root: "/repo/services/orders-admin", label: "services/orders-admin" };
const nested = { root: "/repo/services/orders/plugins/tax", label: "services/orders/plugins/tax" };

describe("hostAround", () => {
  // @covers sta-2888:FR-002
  it("runs in the only member that declares the command, wherever the person stands", () => {
    expect(hostAround([orders], "/elsewhere")).toBe(orders);
  });

  // @covers sta-2888:FR-002
  it("picks the member the working directory sits in, the deepest when they nest", () => {
    expect(hostAround([ordersAdmin, orders], "/repo/services/orders/src")).toBe(orders);
    expect(hostAround([ordersAdmin, orders], "/repo/services/orders")).toBe(orders);
    expect(hostAround([orders, nested], "/repo/services/orders/plugins/tax/src")).toBe(nested);
  });

  // @covers sta-2888:FR-003
  it("picks none at the workspace root or in a sibling that shares a name prefix", () => {
    expect(hostAround([ordersAdmin, orders], "/repo")).toBeUndefined();
    expect(hostAround([orders, nested], "/repo/services/orders-admin")).toBeUndefined();
  });
});
