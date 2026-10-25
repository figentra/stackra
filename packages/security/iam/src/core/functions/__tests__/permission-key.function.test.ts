/**
 * Stackra file contract:
 * Purpose: unit tests of `permissionKey`: a registered static reads its locked key, a key passes through, and an
 *          unregistered static is refused rather than guessed.
 * Boundary: test only; the registry is cleared before each test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 20).
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { Permissions } from "#core/bases/permissions.base";
import { PERMISSION_REGISTRY } from "#core/constants/permission-registry.constant";
import { permissionKey } from "#core/functions/permission-key.function";
import { registerPermissions } from "#core/functions/register-permissions.function";
import { Permission } from "#core/values/permission.value";

class OrderPermissions extends Permissions {
  static readonly cancel = Permission.L2;
}

describe("permissionKey", () => {
  beforeEach(() => PERMISSION_REGISTRY.clear());

  it("reads the locked key of a registered static", () => {
    registerPermissions([{ type: OrderPermissions, keys: { cancel: "orders.order.cancel" } }]);
    expect(permissionKey(OrderPermissions.cancel)).toBe("orders.order.cancel");
  });

  it("passes a key through", () => {
    expect(permissionKey("orders.order.read")).toBe("orders.order.read");
  });

  it("refuses a static gen has not registered", () => {
    expect(() => permissionKey(OrderPermissions.cancel)).toThrow(/not registered/);
  });
});
