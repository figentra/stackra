/**
 * Stackra file contract:
 * Purpose: unit tests of `registerPermissions`: a row gives each static its locked key, and a class that is not a
 *          permission set, a static without a key, a key naming no static and a malformed key all fail at boot.
 * Boundary: test only; the registry is cleared before each test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decisions 20 and 22); ADR 0132 (decision 2).
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { Permissions } from "#core/bases/permissions.base";
import { PERMISSION_REGISTRY } from "#core/constants/permission-registry.constant";
import { registerPermissions } from "#core/functions/register-permissions.function";
import type { PermissionRegistration } from "#core/types/permission-registration.type";
import { Permission } from "#core/values/permission.value";

class OrderPermissions extends Permissions {
  static readonly read = Permission.L0;
  static readonly cancel = Permission.L2;
}

const KEYS = { read: "orders.order.read", cancel: "orders.order.cancel" };

describe("registerPermissions", () => {
  beforeEach(() => PERMISSION_REGISTRY.clear());

  it("registers each static under its locked key", () => {
    registerPermissions([{ type: OrderPermissions, keys: KEYS }]);
    expect(PERMISSION_REGISTRY.get("orders.order.cancel")).toBe(OrderPermissions.cancel);
    expect(PERMISSION_REGISTRY.get("orders.order.read")).toBe(OrderPermissions.read);
  });

  it("refuses a class that is not a permission set", () => {
    const row = { type: class {}, keys: {} } as unknown as PermissionRegistration;
    expect(() => registerPermissions([row])).toThrow(/does not extend Permissions/);
  });

  it("refuses a static without a key, a key without a static and a malformed key", () => {
    expect(() =>
      registerPermissions([{ type: OrderPermissions, keys: { read: KEYS.read } }]),
    ).toThrow(/cancel has no locked key/);
    expect(() =>
      registerPermissions([
        { type: OrderPermissions, keys: { ...KEYS, refund: "orders.order.refund" } },
      ]),
    ).toThrow(/refund is not a Permission static/);
    expect(() =>
      registerPermissions([
        { type: OrderPermissions, keys: { ...KEYS, read: "Orders.Order.Read" } },
      ]),
    ).toThrow(/is not a <module>.<model>.<verb> key/);
  });
});
