/**
 * Stackra file contract:
 * Purpose: unit tests of `registerRoles`: a module role's grants become permission keys under its locked key, and a
 *          class that is not a role, a malformed key and an unregistered grant all fail at boot.
 * Boundary: test only; both registries are cleared before each test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0208 (decision 2, as amended by 0294).
 */
import type { AnyClass } from "@stackra/container";
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { Permissions } from "#core/bases/permissions.base";
import { type Role as RoleInstance, Role } from "#core/bases/role.base";
import { PERMISSION_REGISTRY } from "#core/constants/permission-registry.constant";
import { ROLE_REGISTRY } from "#core/constants/role-registry.constant";
import { registerPermissions } from "#core/functions/register-permissions.function";
import { registerRoles } from "#core/functions/register-roles.function";
import { Permission } from "#core/values/permission.value";

class OrderPermissions extends Permissions {
  static readonly read = Permission.L0;
  static readonly cancel = Permission.L2;
}

class OrderClerkRole extends Role({ grants: [OrderPermissions.read, OrderPermissions.cancel] }) {}

describe("registerRoles", () => {
  beforeEach(() => {
    PERMISSION_REGISTRY.clear();
    ROLE_REGISTRY.clear();
  });

  it("registers the role's grants as permission keys", () => {
    registerPermissions([
      {
        type: OrderPermissions,
        keys: { read: "orders.order.read", cancel: "orders.order.cancel" },
      },
    ]);
    registerRoles([{ type: OrderClerkRole, key: "orders.order_clerk" }]);
    expect(ROLE_REGISTRY.get("orders.order_clerk")).toEqual([
      "orders.order.read",
      "orders.order.cancel",
    ]);
  });

  it("refuses a class that is not a role, a malformed key and an unregistered grant", () => {
    const notRole = class {} as unknown as AnyClass<RoleInstance>;
    expect(() => registerRoles([{ type: notRole, key: "orders.x" }])).toThrow(
      /does not extend Role/,
    );
    expect(() => registerRoles([{ type: OrderClerkRole, key: "OrderClerk" }])).toThrow(/role key/);
    expect(() => registerRoles([{ type: OrderClerkRole, key: "orders.order_clerk" }])).toThrow(
      /not registered/,
    );
  });
});
