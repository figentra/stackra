/**
 * Stackra file contract:
 * Purpose: unit tests of `coversPermission`: the same key, the whole wildcard and a prefix wildcard cover; another
 *          key and a prefix that is not a whole segment do not; a selector covers what
 *          `selectsPermission` picks.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0132 (decisions 2 and 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { Permissions } from "#core/bases/permissions.base";
import { coversPermission } from "#core/functions/covers-permission.function";
import { registerPermissions } from "#core/functions/register-permissions.function";
import { Permission } from "#core/values/permission.value";

class SelectorFixturePermissions extends Permissions {
  static readonly read = Permission.L1;
  static readonly wipe = Permission.L4;
}

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

describe("coversPermission with selectors (STA-818)", () => {
  it("hands a selector to selectsPermission", () => {
    registerPermissions([
      {
        type: SelectorFixturePermissions,
        keys: { read: "fixture.item.read", wipe: "fixture.item.wipe" },
      },
    ]);
    expect(coversPermission("@read", "fixture.item.read")).toBe(true);
    expect(coversPermission("fixture.@risk:l4", "fixture.item.wipe")).toBe(true);
    expect(coversPermission("@read", "fixture.item.wipe")).toBe(false);
  });
});
