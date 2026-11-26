/**
 * Stackra file contract:
 * Purpose: the `DriverRegistry` entry of `SettingFloorSource`, so `DriverName<SettingFloorSource>` is
 *          `"market_pack" | "memory" | "registered_floor_guard"`.
 * Boundary: a module augmentation only; the stand-in for the one gen writes into `#stackra/wiring` (STA-339).
 *           `SettingsConfigOptions` imports this file so the augmentation travels with the config shape.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16); ADR 0263 (gen writes the wiring).
 */
import type { SETTING_FLOOR_SOURCE_DRIVERS } from "#core/constants/setting-floor-source-drivers.constant";

declare module "@stackra/container" {
  interface DriverRegistry {
    /** The driver names of `SettingFloorSource` (`market_pack`, `memory`, `registered_floor_guard`). */
    "settings.SettingFloorSource": (typeof SETTING_FLOOR_SOURCE_DRIVERS)[number];
  }
}
