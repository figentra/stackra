/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryAccessControlDriver`: it allows every call, refuses a denied permission with
 *          `ForbiddenError` on both the permission step and `authorize`, allows it again on `allow`, always passes a
 *          call with no permission, and refuses a restricted permission to a customer unless it was granted, while
 *          staff pass.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 3).
 */
import { Permissions, registerPermissions } from "@stackra/container";
import { ActorKind, ApiArea, Permission, Realm } from "@stackra/contracts";
import { ForbiddenError } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import type { CallDescriptor } from "#contracts/index";
import { MemoryAccessControlDriver } from "#testing/drivers/memory-access-control.driver";

/** A restricted read beside a plain one. */
class LedgerPermissions extends Permissions {
  /** A plain read. */
  static readonly read = Permission.L1;

  /** A read only an explicit grant reaches. */
  static readonly readMedical = Permission.L1.restricted();
}

registerPermissions([
  {
    type: LedgerPermissions,
    keys: { read: "memory_fixture.ledger.read", readMedical: "memory_fixture.ledger.read_medical" },
  },
]);

/** A call needing `permission`, by a customer unless `realm` says otherwise. */
function call(permission?: string, realm: Realm = Realm.Customer): CallDescriptor {
  return {
    callId: "call_1",
    type: class Fixture {},
    kind: "action",
    key: "product.update",
    ...(permission === undefined ? {} : { permission }),
    actor: { kind: ActorKind.User, id: "usr_1", realm },
    area: Object.values(ApiArea)[0] as ApiArea,
  } as CallDescriptor;
}

describe(MemoryAccessControlDriver, () => {
  it("allows every call until a permission is denied", async () => {
    const access = new MemoryAccessControlDriver();
    await expect(access.require(call("catalogue.product.update"))).resolves.toBeUndefined();
    await expect(access.authorize(call("catalogue.product.update"), {})).resolves.toBeUndefined();
  });

  it("refuses a denied permission on both steps, and allows it again", async () => {
    const access = new MemoryAccessControlDriver();
    access.deny("catalogue.product.update");
    await expect(access.require(call("catalogue.product.update"))).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(access.authorize(call("catalogue.product.update"), {})).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(access.require(call("catalogue.product.read"))).resolves.toBeUndefined();
    await expect(access.require(call())).resolves.toBeUndefined();
    access.allow("catalogue.product.update");
    await expect(access.require(call("catalogue.product.update"))).resolves.toBeUndefined();
  });

  /** A restricted permission counts only through an explicit grant, and no customer holds one by default. */
  it("refuses a restricted permission to a customer until it is granted, and passes staff", async () => {
    const access = new MemoryAccessControlDriver();
    await expect(access.require(call("memory_fixture.ledger.read_medical"))).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(
      access.authorize(call("memory_fixture.ledger.read_medical"), {}),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(access.require(call("memory_fixture.ledger.read"))).resolves.toBeUndefined();
    await expect(
      access.require(call("memory_fixture.ledger.read_medical", Realm.Staff)),
    ).resolves.toBeUndefined();
    access.grant("memory_fixture.ledger.read_medical");
    await expect(
      access.require(call("memory_fixture.ledger.read_medical")),
    ).resolves.toBeUndefined();
  });
});
