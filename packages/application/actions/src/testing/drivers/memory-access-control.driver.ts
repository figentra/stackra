/**
 * Stackra file contract:
 * Purpose: `MemoryAccessControlDriver`, the "memory" `AccessControl` of the testing module: every permission and
 *          record check passes, except a permission the test denied with `denyPermission(...)`, and a restricted
 *          permission asked by a customer-realm user the test did not `grant` it to, each refused with
 *          `ForbiddenError` as @stackra/iam refuses it (a restricted permission counts only through an explicit
 *          grant, and no customer holds one).
 * Boundary: test only, and only when a test picks it (`.useDrivers("memory")`, or `{ AccessControl: "memory" }`); a
 *           test that picks nothing still fails closed. Each compiled app gets its own instance, so a denial lasts
 *           for that app or until its restore function runs. A call with no permission (an `auth: false` query)
 *           always passes.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0266 (memory first); ADR 0138 (as amended: permission step).
 */
import { Driver, PERMISSION_REGISTRY } from "@stackra/container";
import { ActorKind, Realm } from "@stackra/contracts";
import { ForbiddenError } from "@stackra/errors";

import { AccessControl } from "#contracts/index";
import { RECORD_POLICY_RUNNER } from "#core/constants/record-policy-runner.constant";
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

  /** The restricted permissions a customer was explicitly granted. */
  private readonly granted = new Set<string>();

  /** Refuses `permission` from now on. */
  deny(permission: string): void {
    this.denied.add(permission);
  }

  /** Allows `permission` again. */
  allow(permission: string): void {
    this.denied.delete(permission);
  }

  /** Grants the restricted `permission` to customers, as an explicit grant would. */
  grant(permission: string): void {
    this.granted.add(permission);
  }

  /** Passes unless the call's permission was denied. */
  async require(call: CallDescriptor): Promise<void> {
    this.check(call);
  }

  /** Passes unless the call's permission was denied, or the record's policy refuses it (when one is connected). */
  async authorize(call: CallDescriptor, record: object): Promise<void> {
    this.check(call);
    const { run } = RECORD_POLICY_RUNNER;
    if (call.permission !== undefined && run !== undefined && !(await run(call, record)))
      throw ForbiddenError.create();
  }

  /** Throws `ForbiddenError` for a denied permission, and for a restricted one a customer was not granted. */
  private check(call: CallDescriptor): void {
    const { permission, actor } = call;
    // an API key's caller: its key holds every required scope exactly (iam's driver also honours selectors)
    if (actor.kind === ActorKind.ApiClient) {
      const needed = call.public?.scopes ?? [];
      const held = call.credential?.scopes ?? [];
      if (needed.length === 0 || !needed.every((scope) => held.includes(scope)))
        throw ForbiddenError.create();
      return;
    }
    if (permission === undefined) return;
    if (this.denied.has(permission)) throw ForbiddenError.create();
    if (
      actor.realm === Realm.Customer &&
      PERMISSION_REGISTRY.get(permission)?.isRestricted === true &&
      !this.granted.has(permission)
    )
      throw ForbiddenError.create();
  }
}
