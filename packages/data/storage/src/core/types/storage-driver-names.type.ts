/**
 * Stackra file contract:
 * Purpose: the `DriverRegistry` entry of `Storage`, so `DriverName<Storage>` is `"memory" | "web" | "native"`.
 * Boundary: a module augmentation only; the stand-in for the one gen writes into `#stackra/wiring` (STA-339).
 *           `StorageOptions` imports this file so the augmentation travels with the config shape.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16); ADR 0263 (gen writes the wiring).
 */
import type { STORAGE_DRIVERS } from "#core/constants/storage-drivers.constant";

declare module "@stackra/container" {
  interface DriverRegistry {
    /** The driver names of `Storage` (`memory`, `web`, `native`). */
    "storage.Storage": (typeof STORAGE_DRIVERS)[number];
  }
}
