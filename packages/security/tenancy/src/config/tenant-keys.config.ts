/**
 * Stackra file contract:
 * Purpose: `TenantKeysConfig`, the configuration of the tenants' data keys (key `tenancy.tenant_keys`): the
 *          `KeyProvider` and `TenantDataKeyStore` drivers, the region's KMS key and the unwrapped-key cache bounds.
 * Boundary: a configuration class over `TenantKeysOptions` with no env map; runway's layer sets it per environment
 *           (production: `kms` and `postgres` with the region's KMS key). No credential: the runtime's AWS role signs
 *           the KMS calls. The defaults (`ephemeral`, `memory`) keep a boot with no configuration working.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0146 as amended; ADR 0188 (2026-11-09 amendment).
 */
import { Config } from "@stackra/config";

import { TenantKeysOptions } from "#core/schemas/tenant-keys-options.schema";

/**
 * The tenant key configuration.
 * @example
 * const config = buildConfig(TenantKeysConfig, { values: { driver: "kms", store: "postgres", kmsKeyId } });
 */
export class TenantKeysConfig extends Config({ schema: TenantKeysOptions }) {}
