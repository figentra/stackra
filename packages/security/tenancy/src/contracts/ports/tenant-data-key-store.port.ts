/**
 * Stackra file contract:
 * Purpose: the `TenantDataKeyStore` port: where each tenant's wrapped data keys live (ADR 0188 decision 2, amendment
 *          2026-11-09), oldest first, so one `KeyProvider` driver serves every tenant.
 * Boundary: an abstract class that is its own token, keyed `tenancy.TenantDataKeyStore`. Append-only: a key is added,
 *           never changed; deleting the tenant deletes its keys (the crypto-shred). It holds KMS ciphertext only, never
 *           a plaintext key, and never logs one. Drivers: `postgres` (the tenant-owned `tenancy.tenant_data_keys`) and
 *           `memory` (dev and tests), picked by `TenantKeysConfig.store`.
 * Runtime: isomorphic
 * Governing contract: ADR 0188 (decision 2 and its 2026-11-09 amendment); ADR 0173 (nobody reads a value).
 */
import { Port } from "@stackra/contracts";
import type { PublicId, WrappedDataKey } from "@stackra/contracts";

/**
 * The wrapped data keys of each tenant.
 *
 * @example
 * const keys = await store.list(tenantId); // [{ id: "k1", wrapped: "…" }, { id: "k2", wrapped: "…" }]
 */
export abstract class TenantDataKeyStore extends Port {
  /** Type-only port key, so `DriverName<TenantDataKeyStore>` narrows to this port's drivers. */
  declare readonly "~key": "tenancy.TenantDataKeyStore";

  /** The tenant's wrapped keys, oldest first; empty before its first key is minted. */
  abstract list(tenantId: PublicId<"scp">): Promise<readonly WrappedDataKey[]>;

  /**
   * Adds the tenant's next key. A key id the tenant already has is not added again: `false`, so two callers that
   * mint the same next key at once keep the first.
   */
  abstract add(tenantId: PublicId<"scp">, key: WrappedDataKey): Promise<boolean>;
}
