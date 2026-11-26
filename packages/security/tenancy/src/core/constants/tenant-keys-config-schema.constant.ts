/**
 * Stackra file contract:
 * Purpose: `TENANT_KEYS_CONFIG_SCHEMA`, the zod schema this package ships for `TenantKeysConfig` (exported as
 *          `TenantKeysConfig$`): which `KeyProvider` and `TenantDataKeyStore` drivers run, the region's KMS key, the
 *          KMS region and the bounds of the unwrapped-key cache.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           full defaults; they equal `TenantKeysOptions`' initializers (tested). Ids and numbers only, never a key.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0188 (2026-11-09 amendment).
 */
import { z } from "zod";

import { TENANT_DATA_KEY_STORE_DRIVERS } from "#core/constants/tenant-data-key-store-drivers.constant";

/** The shipped `TenantKeysConfig$`. */
export const TENANT_KEYS_CONFIG_SCHEMA = z.object({
  // Any driver name: products ship their own `KeyProvider` drivers, and the container refuses a name no driver has
  // when it resolves the port (STA-2693).
  driver: z.string().min(1).default("ephemeral"),
  store: z.enum(TENANT_DATA_KEY_STORE_DRIVERS).default("memory"),
  kmsKeyId: z.string().default(""),
  region: z.string().default(""),
  cacheSeconds: z.int().min(1).max(86_400).default(300),
  cacheTenants: z.int().min(1).max(100_000).default(1000),
});
