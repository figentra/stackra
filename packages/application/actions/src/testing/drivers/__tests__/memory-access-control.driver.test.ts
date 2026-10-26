/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryAccessControlDriver`: it allows every call, refuses a denied permission with
 *          `ForbiddenError` on both the permission step and `authorize`, allows it again on `allow`, and always passes a
 *          call with no permission.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 3).
 */
import { ActorKind, ApiArea, Realm } from "@stackra/contracts";
import { ForbiddenError } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import type { CallDescriptor } from "#contracts/index";
import { MemoryAccessControlDriver } from "#testing/drivers/memory-access-control.driver";

/** A call needing `permission`. */
function call(permission?: string): CallDescriptor {
  return {
    callId: "call_1",
    type: class Fixture {},
    kind: "action",
    key: "product.update",
    ...(permission === undefined ? {} : { permission }),
    actor: { kind: ActorKind.User, id: "usr_1", realm: Realm.Customer },
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
});
