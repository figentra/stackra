/**
 * Stackra file contract:
 * Purpose: the `DriverRegistry` entry of `TenantDataKeyStore`, so `DriverName<TenantDataKeyStore>` is
 *          `"memory" | "postgres"`.
 * Boundary: a module augmentation only; the stand-in for the one gen writes into `#stackra/wiring` (STA-339).
 *           `TenantKeysOptions` imports this file so the augmentation travels with the config shape. `KeyProvider` has
 *           no entry here: products ship their own drivers, so the member's generated wiring declares its names
 *           (STA-2693).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16); ADR 0263 (gen writes the wiring).
 */
import type { TENANT_DATA_KEY_STORE_DRIVERS } from "#core/constants/tenant-data-key-store-drivers.constant";

declare module "@stackra/container" {
  interface DriverRegistry {
    /** The driver names of `TenantDataKeyStore` (`memory`, `postgres`). */
    "tenancy.TenantDataKeyStore": (typeof TENANT_DATA_KEY_STORE_DRIVERS)[number];
  }
}
