/**
 * Stackra file contract:
 * Purpose: `TenantKeysOptions`, the shape of `TenantKeysConfig`: which `KeyProvider` driver serves the tenants' data
 *          keys and which `TenantDataKeyStore` holds them wrapped, the region's KMS key, the KMS region, and how long
 *          and for how many tenants unwrapped keys stay cached.
 * Boundary: a shape class; it registers this package's own schema (`TENANT_KEYS_CONFIG_SCHEMA`) for itself when the
 *           module loads. Ids and numbers only: the data keys stay wrapped in the store and in KMS, and are never
 *           configured. Each hosting region sets its own regional `kmsKeyId`, so an EU tenant's keys are wrapped only
 *           in the EU (ADR 0188 amendment, point 5).
 * Runtime: isomorphic
 * Governing contract: ADR 0188 (2026-11-09 amendment); ADR 0146 as amended; ADR 0294 (decisions 19 and 26).
 */
import "#core/types/key-provider-driver-names.type";

import type { DriverName } from "@stackra/container";
import type { KeyProvider } from "@stackra/contracts";
import { Int, registerSchemas, Schema } from "@stackra/validation";

import type { TenantDataKeyStore } from "#contracts/ports/tenant-data-key-store.port";
import { TENANT_KEYS_CONFIG_SCHEMA } from "#core/constants/tenant-keys-config-schema.constant";

/**
 * The tenant key settings.
 * @example
 * export class TenantKeysConfig extends BaseTenantKeysConfig {
 *   override driver = "kms" as const;
 *   override store = "postgres" as const;
 *   override kmsKeyId = "alias/tenant-data-keys";
 * }
 */
export class TenantKeysOptions extends Schema {
  /** How long an unwrapped key stays cached, in seconds. */
  @Int({
    min: 1,
    max: 86_400,
  })
  cacheSeconds = 300;

  /** At most this many tenants' unwrapped keys are cached; the least recently used leaves first. */
  @Int({
    min: 1,
    max: 100_000,
  })
  cacheTenants = 1000;

  /** Which `KeyProvider` driver runs: `ephemeral` (random keys in process, dev and tests) or `kms` (production). */
  driver: DriverName<KeyProvider> = "ephemeral";

  /** Which `TenantDataKeyStore` holds the wrapped keys: `memory` (dev and tests) or `postgres` (production). */
  store: DriverName<TenantDataKeyStore> = "memory";

  /** The region's KMS key id, ARN or alias the `kms` driver wraps and unwraps with; it refuses while empty. */
  kmsKeyId = "";

  /** The KMS region the `aws-sdk` client calls (`eu-central-1`); empty means the SDK's default (`AWS_REGION`). */
  region = "";
}

registerSchemas([[TenantKeysOptions, TENANT_KEYS_CONFIG_SCHEMA]]);
