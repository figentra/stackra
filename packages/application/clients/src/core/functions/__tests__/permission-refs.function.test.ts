/**
 * Stackra file contract:
 * Purpose: unit test of `permissionRefs`: the console's spelling is the same factory as `permissionsRef`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 20).
 */
import { describe, expect, it } from "@stackra/testing";

import { permissionRefs } from "#core/functions/permission-refs.function";
import { permissionsRef } from "#core/functions/permissions-ref.function";

class StockPermissions extends permissionRefs("inventory.stock", ["read", "manage"]) {}

describe("permissionRefs", () => {
  it("is permissionsRef", () => {
    expect(permissionRefs).toBe(permissionsRef);
    expect(StockPermissions.manage).toBe("inventory.stock.manage");
  });
});
