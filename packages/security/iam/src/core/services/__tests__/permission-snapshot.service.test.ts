/**
 * Stackra file contract:
 * Purpose: unit tests of `PermissionSnapshotService`: it starts empty, `set` replaces the keys and notifies
 *          subscribers until they unsubscribe, and `can` covers a held key, a wildcard and a registered static, over
 *          the held keys or a given list.
 * Boundary: test only; the permission registry is cleared before each test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0208 (decision 6); ADR 0132 (decision 5).
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { Permissions } from "#core/bases/permissions.base";
import { PERMISSION_REGISTRY } from "#core/constants/permission-registry.constant";
import { registerPermissions } from "#core/functions/register-permissions.function";
import { PermissionSnapshotService } from "#core/services/permission-snapshot.service";
import { Permission } from "#core/values/permission.value";

class OrderPermissions extends Permissions {
  static readonly create = Permission.L1;
}

describe("PermissionSnapshotService", () => {
  beforeEach(() => {
    PERMISSION_REGISTRY.clear();
    registerPermissions([{ type: OrderPermissions, keys: { create: "orders.order.create" } }]);
  });

  it("starts empty and holds nothing", () => {
    const snapshot = new PermissionSnapshotService();
    expect(snapshot.current()).toEqual([]);
    expect(snapshot.can("orders.order.read")).toBe(false);
  });

  it("replaces the keys and notifies until a listener unsubscribes", () => {
    const snapshot = new PermissionSnapshotService();
    let calls = 0;
    const stop = snapshot.subscribe(() => {
      calls += 1;
    });
    snapshot.set(["orders.order.read"]);
    stop();
    stop();
    snapshot.set([]);
    expect(calls).toBe(1);
    expect(snapshot.current()).toEqual([]);
  });

  it("covers a held key, a wildcard and a registered static", () => {
    const snapshot = new PermissionSnapshotService();
    snapshot.set(["orders.order.read", "catalogue.*"]);
    expect(snapshot.can("orders.order.read")).toBe(true);
    expect(snapshot.can("catalogue.product.read")).toBe(true);
    expect(snapshot.can(OrderPermissions.create)).toBe(false);
    expect(snapshot.can(OrderPermissions.create, ["orders.order.create"])).toBe(true);
  });
});
