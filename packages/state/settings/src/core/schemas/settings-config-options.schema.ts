/**
 * Stackra file contract:
 * Purpose: `SettingsConfigOptions`, the shape of `SettingsConfig`: which `SettingValueStore` driver holds the stored
 *          values and which `SettingFloorSource` driver supplies the floors.
 * Boundary: a shape class; it registers this package's own schema (`SETTINGS_CONFIG_SCHEMA`) for itself when the
 *           module loads. Named `...ConfigOptions` because `SettingsOptions` is what `Settings({...})` takes. Driver
 *           names only.
 * Runtime: isomorphic
 * Governing contract: ADR 0213; ADR 0146 as amended; ADR 0294 (decisions 19 and 26).
 */
import "#core/types/setting-floor-source-driver-names.type";
import "#core/types/setting-value-store-driver-names.type";

import type { DriverName } from "@stackra/container";
import { registerSchemas, Schema } from "@stackra/validation";

import type { SettingFloorSource } from "#contracts/ports/setting-floor-source.port";
import type { SettingValueStore } from "#contracts/ports/setting-value-store.port";
import { SETTINGS_CONFIG_SCHEMA } from "#core/constants/settings-config-schema.constant";

/**
 * The settings' drivers.
 *
 * @example
 * export class SettingsConfig extends BaseSettingsConfig {
 *   override store = "postgres" as const;
 *   override floors = "registered_floor_guard" as const;
 * }
 */
export class SettingsConfigOptions extends Schema {
  /**
   * Which `SettingValueStore` driver holds the stored values: `memory` (in process, tests and local runs; the default)
   * or `postgres` (`./node`), which a service's production config selects.
   */
  store: DriverName<SettingValueStore> = "memory";

  /**
   * Which `SettingFloorSource` driver supplies the floors: `memory` (the default), `market_pack` (the market pack's
   * floors) or `registered_floor_guard` (`./node`, the floors the services registered), which production selects.
   */
  floors: DriverName<SettingFloorSource> = "memory";
}

registerSchemas([[SettingsConfigOptions, SETTINGS_CONFIG_SCHEMA]]);
