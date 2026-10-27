/**
 * Stackra file contract:
 * Purpose: `MemoryTenantSharesDriver`, a `TenantShares` held in memory, for tests and local runs.
 * Boundary: process-local and unsynchronised; never a production store, and keeps no audit trail.
 * Runtime: isomorphic
 * Governing contract: ADR 0343 (decision 1); ADR 0263 (a driver is named by its class: `memory`).
 */
import { Driver } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";

import { TenantShares } from "#core/ports/tenant-shares.port";
import type { TenantShare } from "#core/types/tenant-share.type";

/**
 * Shares held in memory.
 *
 * @example
 * const store = new MemoryTenantSharesDriver();
 */
export class MemoryTenantSharesDriver extends Driver(TenantShares) {
  /** Share id to share. */
  private readonly shares = new Map<PublicId<"shr">, TenantShare>();

  /** Records `share`, replacing one with the same id. */
  save(share: TenantShare): Promise<void> {
    this.shares.set(share.id, Object.freeze({ ...share }));
    return Promise.resolve();
  }

  /** The share `id`, or `undefined`. */
  get(id: PublicId<"shr">): Promise<TenantShare | undefined> {
    return Promise.resolve(this.shares.get(id));
  }

  /** The shares of `tenant`, either side. */
  list(tenant: PublicId<"scp">): Promise<readonly TenantShare[]> {
    return Promise.resolve(
      [...this.shares.values()].filter(
        (share) => share.proposer === tenant || share.receiver === tenant,
      ),
    );
  }
}
