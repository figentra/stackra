/**
 * Stackra file contract:
 * Purpose: the `DriverRegistry` entries of `KeyProvider` and `TenantDataKeyStore`, so `DriverName<KeyProvider>` is
 *          `"ephemeral" | "kms"` and `DriverName<TenantDataKeyStore>` is `"memory" | "postgres"`.
 * Boundary: a module augmentation only; the stand-in for the one gen writes into `#stackra/wiring` (STA-339).
 *           `TenantKeysOptions` imports this file so the augmentation travels with the config shape.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16); ADR 0263 (gen writes the wiring).
 */
import type { KEY_PROVIDER_DRIVERS } from "#core/constants/key-provider-drivers.constant";
import type { TENANT_DATA_KEY_STORE_DRIVERS } from "#core/constants/tenant-data-key-store-drivers.constant";

declare module "@stackra/container" {
  interface DriverRegistry {
    /** The driver names of `KeyProvider` (`ephemeral`, `kms`). */
    "contracts.KeyProvider": (typeof KEY_PROVIDER_DRIVERS)[number];
    /** The driver names of `TenantDataKeyStore` (`memory`, `postgres`). */
    "tenancy.TenantDataKeyStore": (typeof TENANT_DATA_KEY_STORE_DRIVERS)[number];
  }
}
