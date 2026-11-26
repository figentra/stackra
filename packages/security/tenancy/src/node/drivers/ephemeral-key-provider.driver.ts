/**
 * Stackra file contract:
 * Purpose: `EphemeralKeyProviderDriver`, the `ephemeral` driver of @stackra/contracts' `KeyProvider`, and the default:
 *          each tenant's random 256-bit keys in process, for dev and tests, with the same tenant and rotation rules as
 *          `kms` (the call's tenant only, ids `k1`, `k2`, …, the newest current, older ones still opened by id).
 * Boundary: a container driver with no dependency, so a boot with no configuration works. The keys are lost when the
 *           process ends, so data it sealed cannot be opened after a restart: never production. Never logs or lists a
 *           key.
 * Runtime: node
 * Governing contract: ADR 0188 (2026-11-09 amendment); ADR 0266 (memory first); ADR 0173.
 */
import { Driver } from "@stackra/container";
import { KeyProvider } from "@stackra/contracts";
import type { DataKey, PublicId } from "@stackra/contracts";

import { ACTIVE_TENANT } from "#node/constants/active-tenant.constant";

/**
 * Random keys per tenant, in process.
 * @example
 * const keys = new EphemeralKeyProviderDriver();
 * await tenancy.withTenant(actor, () => keys.current()); // { id: "k1", key: Uint8Array(32) }
 */
export class EphemeralKeyProviderDriver extends Driver(KeyProvider) {
  /** Each tenant's keys, oldest first. */
  private readonly keys = new Map<string, DataKey[]>();

  /**
   * The running tenant's newest key, made on its first seal.
   * @throws RangeError for a platform call.
   */
  async current(): Promise<DataKey> {
    const held = this.keysOf(this.tenant());
    // keysOf makes the first key, so the list is never empty
    return held.at(-1) as DataKey;
  }

  /**
   * The running tenant's key `id`.
   * @throws RangeError for a platform call or an id the tenant has no key for.
   */
  async byId(id: string): Promise<DataKey> {
    const key = this.keysOf(this.tenant()).find((one) => one.id === id);
    if (key === undefined) throw new RangeError(`No data key has the id ${id}`);
    return key;
  }

  /**
   * Adds the running tenant's next key and makes it current.
   * @throws RangeError for a platform call.
   */
  async rotate(): Promise<DataKey> {
    const held = this.keysOf(this.tenant());
    const next = Object.freeze({
      id: `k${held.length + 1}`,
      key: crypto.getRandomValues(new Uint8Array(32)),
    });
    held.push(next);
    return next;
  }

  /** The running call's tenant. */
  private tenant(): PublicId<"scp"> {
    const tenant = ACTIVE_TENANT.getStore();
    if (tenant === undefined)
      throw new RangeError(
        "A tenant data key needs a tenant call (withTenant); a platform call has none",
      );
    return tenant;
  }

  /** The tenant's keys, its first made now when it has none. */
  private keysOf(tenant: PublicId<"scp">): DataKey[] {
    let held = this.keys.get(tenant);
    if (held === undefined) {
      held = [Object.freeze({ id: "k1", key: crypto.getRandomValues(new Uint8Array(32)) })];
      this.keys.set(tenant, held);
    }
    return held;
  }
}
