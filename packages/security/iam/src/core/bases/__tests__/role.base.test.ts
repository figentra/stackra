/**
 * Stackra file contract:
 * Purpose: unit tests of `Role`: the called form records its grants as the `role` kind, and refuses no grant, a value
 *          that is not a `Permission`, and a system permission.
 * Boundary: test only; the role mirrors the conversion guide's `OrderClerkRole`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0208 (decision 2 and the 0294 note).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { Permissions } from "#core/bases/permissions.base";
import { Role } from "#core/bases/role.base";
import { Permission } from "#core/values/permission.value";
import type { RoleOptions } from "#core/types/role-options.type";

class OrderPermissions extends Permissions {
  static readonly read = Permission.L0;

  static readonly cancel = Permission.L2;

  static readonly expire = Permission.L2.system();
}

class OrderClerkRole extends Role({ grants: [OrderPermissions.read, OrderPermissions.cancel] }) {}

describe("Role", () => {
  it("records its grants as the role kind", () => {
    expect(kindOf(OrderClerkRole)).toEqual({
      kind: "role",
      options: { grants: [OrderPermissions.read, OrderPermissions.cancel] },
    });
    expect(new OrderClerkRole()).toBeInstanceOf(OrderClerkRole);
  });

  it("refuses no grant, a value that is not a Permission, and a system permission", () => {
    expect(() => Role({ grants: [] })).toThrow(TypeError);
    expect(() => Role({ grants: ["orders.order.read"] } as unknown as RoleOptions)).toThrow(
      TypeError,
    );
    expect(() => Role({ grants: [OrderPermissions.expire] })).toThrow(/system permission/);
  });
});
