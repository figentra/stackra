/**
 * Stackra file contract:
 * Purpose: `MemoryAccessControlDriver`, the "memory" `AccessControl` of the testing module: every permission and
 *          record check passes, except a permission the test denied with `denyPermission(...)`, which is refused with
 *          `ForbiddenError` as @stackra/iam refuses it.
 * Boundary: test only, and only when a test picks it (`.useDrivers("memory")`, or `{ AccessControl: "memory" }`); a
 *           test that picks nothing still fails closed. Each compiled app gets its own instance, so a denial lasts
 *           for that app or until its restore function runs. A call with no permission (an `auth: false` query)
 *           always passes.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0266 (memory first); ADR 0138 (as amended: permission step).
 */
import { Driver } from "@stackra/container";
import { ForbiddenError } from "@stackra/errors";

import { AccessControl } from "#contracts/index";
import type { CallDescriptor } from "#contracts/index";

/**
 * Allows every call but the denied permissions.
 *
 * @example
 * const app = await createTestingModule(CatalogueModule).useDrivers("memory").compile();
 * denyPermission("catalogue.product.update"); // the next update call is refused with ForbiddenError
 */
export class MemoryAccessControlDriver extends Driver(AccessControl) {
  /** The permissions this app refuses. */
  private readonly denied = new Set<string>();

  /** Refuses `permission` from now on. */
  deny(permission: string): void {
    this.denied.add(permission);
  }

  /** Allows `permission` again. */
  allow(permission: string): void {
    this.denied.delete(permission);
  }

  /** Passes unless the call's permission was denied. */
  async require(call: CallDescriptor): Promise<void> {
    this.check(call);
  }

  /** Passes unless the call's permission was denied; no record policy runs. */
  async authorize(call: CallDescriptor, _record: object): Promise<void> {
    this.check(call);
  }

  /** Throws `ForbiddenError` for a denied permission. */
  private check(call: CallDescriptor): void {
    if (call.permission !== undefined && this.denied.has(call.permission))
      throw ForbiddenError.create();
  }
}
