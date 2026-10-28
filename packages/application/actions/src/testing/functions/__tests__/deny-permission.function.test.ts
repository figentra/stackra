/**
 * Stackra file contract:
 * Purpose: unit tests of `denyPermission` and the plugin's "memory" `AccessControl`: `.useDrivers("memory")` binds the
 *          memory driver (no override, no iam), the package's own tests get it without asking, a denial refuses that
 *          permission until restored, and the helper throws when the app did not take the memory driver.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 3).
 */
import { Driver, Module } from "@stackra/container";
import { createTestingModule, registerWiring } from "@stackra/container/testing";
import { ActorKind, ApiArea, Realm } from "@stackra/contracts";
import { ForbiddenError } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { AccessControl } from "#contracts/index";
import type { CallDescriptor } from "#contracts/index";
import "#testing/index";
import { MemoryAccessControlDriver } from "#testing/drivers/memory-access-control.driver";
import { denyPermission } from "#testing/functions/deny-permission.function";

class AllowAll extends Driver(AccessControl) {
  async require(): Promise<void> {}

  async authorize(): Promise<void> {}
}

class DenyFixtureModule extends Module {}

registerWiring({ member: "deny_fixture", root: DenyFixtureModule });

const update: CallDescriptor = {
  callId: "call_1",
  type: DenyFixtureModule,
  kind: "action",
  key: "product.update",
  permission: "catalogue.product.update",
  actor: { kind: ActorKind.User, id: "usr_1", realm: Realm.Customer },
  area: Object.values(ApiArea)[0] as ApiArea,
};

describe(denyPermission, () => {
  it('binds the memory AccessControl under useDrivers("memory") and denies until restored', async () => {
    const app = await createTestingModule(DenyFixtureModule).useDrivers("memory").compile();
    const access = app.get(AccessControl);
    expect(access).toBeInstanceOf(MemoryAccessControlDriver);
    const restore = denyPermission("catalogue.product.update");
    await expect(access.require(update)).rejects.toBeInstanceOf(ForbiddenError);
    restore();
    await expect(access.require(update)).resolves.toBeUndefined();
  });

  it("binds the memory AccessControl in the package's own tests without useDrivers (ADR 0266)", async () => {
    const app = await createTestingModule(DenyFixtureModule).compile();
    expect(app.get(AccessControl)).toBeInstanceOf(MemoryAccessControlDriver);
  });

  it("refuses an app whose AccessControl is overridden", async () => {
    await createTestingModule(DenyFixtureModule).override(AccessControl, new AllowAll()).compile();
    expect(() => denyPermission("catalogue.product.update")).toThrow(/memory AccessControl/);
  });
});
