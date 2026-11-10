/**
 * Stackra file contract:
 * Purpose: `TenantDataKey`, one of a tenant's wrapped data keys (ADR 0188 decision 2, amendment 2026-11-09): its
 *          version, its id (`k<version>`) and the KMS ciphertext of the 256-bit key.
 * Boundary: data and indexes. Key `tenancy.tenant_data_key`, table `tenancy.tenant_data_keys`, public ids `tdk_…`.
 *           Tenant-owned through `BelongsToTenant` with the forced equality policy, so another tenant's keys are
 *           invisible; insert-only by trait and by revoking UPDATE. Unique per (tenant, version), so two concurrent
 *           mints of the same next key keep one. Deleting the tenant deletes its rows, which destroys its keys. The
 *           plaintext key is never stored here.
 * Runtime: node
 * Governing contract: ADR 0188 (decision 2 and its 2026-11-09 amendment); ADR 0321 and 0323 d1 (`BelongsToTenant`);
 *                     ADR 0239 (equality on `tenant_id`); ADR 0294 (decisions 4 and 20).
 */
import { AppendOnly, HasPublicId, Index, Model } from "@stackra/model";
import { Int } from "@stackra/validation";

import { BelongsToTenant } from "#node/traits/belongs-to-tenant.trait";

/** One wrapped data key of a tenant. */
@Index(["tenantId", "version"], { unique: true })
export class TenantDataKey extends Model.with(HasPublicId("tdk"), BelongsToTenant, AppendOnly) {
  /** The key's version in its tenant, from 1; the highest is current. */
  @Int({ min: 1 })
  version!: number;

  /** The key's id, `k<version>`, which data sealed under it names. */
  keyId!: string;

  /** The KMS ciphertext of the 256-bit data key, base64url. */
  wrapped!: string;
}
