/**
 * Stackra file contract:
 * Purpose: `MemoryTenantDataKeyStoreDriver`, the `memory` driver of `TenantDataKeyStore`: each tenant's wrapped keys in
 *          process, oldest first, for dev and tests.
 * Boundary: append-only, as the port says: a key id a tenant already has is not added again. Lost when the process
 *           ends, so it never holds a production key. Holds ciphertext only.
 * Runtime: isomorphic
 * Governing contract: ADR 0188 (2026-11-09 amendment); ADR 0266 (memory first).
 */
import { Driver } from "@stackra/container";
import type { PublicId, WrappedDataKey } from "@stackra/contracts";

import { TenantDataKeyStore } from "#contracts/ports/tenant-data-key-store.port";

/**
 * Wrapped keys in process memory.
 * @example
 * const store = new MemoryTenantDataKeyStoreDriver();
 * await store.add(tenantId, { id: "k1", wrapped });
 */
export class MemoryTenantDataKeyStoreDriver extends Driver(TenantDataKeyStore) {
  /** Each tenant's keys, oldest first. */
  private readonly keys = new Map<string, WrappedDataKey[]>();

  /** Lists the tenant's wrapped data keys, oldest first (`TenantDataKeyStore.list`). */
  async list(tenantId: PublicId<"scp">): Promise<readonly WrappedDataKey[]> {
    return [...(this.keys.get(tenantId) ?? [])];
  }

  /** Adds a wrapped data key for the tenant, false when its id is already held (`TenantDataKeyStore.add`). */
  async add(tenantId: PublicId<"scp">, key: WrappedDataKey): Promise<boolean> {
    const held = this.keys.get(tenantId) ?? [];
    if (held.some((one) => one.id === key.id)) return false;
    held.push(Object.freeze({ id: key.id, wrapped: key.wrapped }));
    this.keys.set(tenantId, held);
    return true;
  }
}
