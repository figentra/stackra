/**
 * Stackra file contract:
 * Purpose: the `DriverRegistry` entry of `SettingValueStore`, so `DriverName<SettingValueStore>` is
 *          `"memory" | "postgres"`.
 * Boundary: a module augmentation only; the stand-in for the one gen writes into `#stackra/wiring` (STA-339).
 *           `SettingsConfigOptions` imports this file so the augmentation travels with the config shape.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16); ADR 0263 (gen writes the wiring).
 */
import type { SETTING_VALUE_STORE_DRIVERS } from "#core/constants/setting-value-store-drivers.constant";

declare module "@stackra/container" {
  interface DriverRegistry {
    /** The driver names of `SettingValueStore` (`memory`, `postgres`). */
    "settings.SettingValueStore": (typeof SETTING_VALUE_STORE_DRIVERS)[number];
  }
}
