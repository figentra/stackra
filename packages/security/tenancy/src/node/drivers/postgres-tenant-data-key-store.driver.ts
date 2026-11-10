/**
 * Stackra file contract:
 * Purpose: `PostgresTenantDataKeyStoreDriver`, the `postgres` driver of `TenantDataKeyStore`: each tenant's wrapped
 *          keys in the tenant-owned, append-only `tenancy.tenant_data_keys`, through `TenantDataKeyService`.
 * Boundary: runs in the call's tenant session only: a `tenantId` other than the running call's tenant is refused before
 *           any read or write, and row-level security hides every other tenant's rows besides. Ciphertext only.
 * Runtime: node
 * Governing contract: ADR 0188 (decision 2 and its 2026-11-09 amendment); ADR 0239 (equality on `tenant_id`).
 */
import { Driver } from "@stackra/container";
import type { PublicId, WrappedDataKey } from "@stackra/contracts";

import { TenantDataKeyStore } from "#contracts/ports/tenant-data-key-store.port";
import { ACTIVE_TENANT } from "#node/constants/active-tenant.constant";
import type { TenantDataKeyService } from "#node/services/tenant-data-key.service";

/**
 * Wrapped keys in Postgres, per tenant.
 * @example
 * await tenancy.withTenant(actor, () => store.list(tenantId));
 */
export class PostgresTenantDataKeyStoreDriver extends Driver(TenantDataKeyStore) {
  /** The model service over the key rows. */
  private readonly keys: TenantDataKeyService;

  /**
   * @param keys - the model service over `tenancy.tenant_data_keys`.
   */
  constructor(keys: TenantDataKeyService) {
    super();
    this.keys = keys;
  }

  /**
   * See `TenantDataKeyStore.list`.
   * @throws RangeError when `tenantId` is not the running call's tenant.
   */
  list(tenantId: PublicId<"scp">): Promise<readonly WrappedDataKey[]> {
    this.inTenant(tenantId);
    return this.keys.listOf(tenantId);
  }

  /**
   * See `TenantDataKeyStore.add`.
   * @throws RangeError when `tenantId` is not the running call's tenant.
   */
  add(tenantId: PublicId<"scp">, key: WrappedDataKey): Promise<boolean> {
    this.inTenant(tenantId);
    return this.keys.append(tenantId, key);
  }

  /** Refuses a tenant other than the running call's: the session's policy and the tenant column must agree. */
  private inTenant(tenantId: PublicId<"scp">): void {
    if (ACTIVE_TENANT.getStore() !== tenantId)
      throw new RangeError(
        "A tenant's data keys are read and written only inside that tenant's call",
      );
  }
}
