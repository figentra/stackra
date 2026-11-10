/**
 * Stackra file contract:
 * Purpose: `TenantDataKeyService`, the module service over `TenantDataKey`: lists a tenant's wrapped keys oldest first
 *          and appends its next key, recording `TenantDataKeyMinted` on the new row, for the `postgres` driver of
 *          `TenantDataKeyStore`.
 * Boundary: a `CrudService<TenantDataKey>`, so every read and write runs in the caller's transaction and tenant session
 *           under row-level security: another tenant's keys are invisible. The append runs in a savepoint, so a
 *           concurrent mint of the same version (`UniqueViolation`) answers `false` without failing the caller's
 *           transaction. The tenant column is the session's (`BelongsToTenant`), never input.
 * Runtime: node
 * Governing contract: ADR 0188 (decision 2 and its 2026-11-09 amendment); ADR 0239; ADR 0105 as amended by ADR 0294.
 */
import type { PublicId, WrappedDataKey } from "@stackra/contracts";
import { CrudService, UniqueViolation } from "@stackra/database";

import { TenantDataKeyMinted } from "#core/events/tenant-data-key-minted.event";
import { TenantDataKey } from "#node/models/tenant-data-key.model";

/**
 * A tenant's wrapped data keys.
 * @example
 * const keys = await service.listOf(tenantId);
 */
export class TenantDataKeyService extends CrudService<TenantDataKey> {
  /** The tenant's wrapped keys, oldest first; the session's row-level security shows its own only. */
  async listOf(tenantId: PublicId<"scp">): Promise<readonly WrappedDataKey[]> {
    const rows = await this.find({ tenantId } as never, { orderBy: { version: "asc" } } as never);
    return rows.map((row) => Object.freeze({ id: row.keyId, wrapped: row.wrapped }));
  }

  /**
   * Appends the tenant's key `key` (`k<version>`), recording `TenantDataKeyMinted`.
   *
   * @returns `false` when the tenant already has that version (a concurrent mint kept the first).
   * @throws RangeError when the key id is not `k<version>`.
   */
  async append(tenantId: PublicId<"scp">, key: WrappedDataKey): Promise<boolean> {
    const version = /^k([1-9][0-9]{0,8})$/.exec(key.id)?.[1];
    if (version === undefined)
      throw new RangeError(`A tenant data key id is k<version>, got ${key.id}`);
    try {
      await this.em().transactional(async (em) => {
        const row = em.create(TenantDataKey, {
          version: Number(version),
          keyId: key.id,
          wrapped: key.wrapped,
        } as never);
        row.record(TenantDataKeyMinted.create({ tenantId, keyId: key.id }));
        await em.flush();
      });
      return true;
    } catch (error) {
      if (error instanceof UniqueViolation) return false;
      throw error;
    }
  }
}
