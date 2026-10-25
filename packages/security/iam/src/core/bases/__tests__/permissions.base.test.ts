/**
 * Stackra file contract:
 * Purpose: unit test of `Permissions`: a bare kind base registered as `permissions`, which a model's permission set
 *          extends with `Permission` statics, each its own object.
 * Boundary: test only; the set mirrors the template's `OrderPermissions`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0132 (as amended by 0294); ADR 0294 (decision 16).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { Permissions } from "#core/bases/permissions.base";
import { Risk } from "#core/enums/risk.enum";
import { Permission } from "#core/values/permission.value";

class OrderPermissions extends Permissions {
  static readonly read = Permission.L0;
  static readonly create = Permission.L1;
  static readonly expire = Permission.L2.system();
}

describe("Permissions", () => {
  it("is the permissions kind, read through a subclass", () => {
    expect(kindOf(OrderPermissions)).toEqual({ kind: "permissions", options: {} });
  });

  it("keeps each static as its own Permission", () => {
    expect(OrderPermissions.read).not.toBe(OrderPermissions.create);
    expect(OrderPermissions.create.risk).toBe(Risk.L1);
    expect(OrderPermissions.expire.isSystem).toBe(true);
  });
});
