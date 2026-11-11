/**
 * Stackra file contract:
 * Purpose: `SettingsConfig`, the configuration that picks this package's `SettingValueStore` and `SettingFloorSource`
 *          drivers (key `settings`).
 * Boundary: a configuration class over `SettingsConfigOptions` with no env map; runway's layer sets it per
 *           environment. A host overrides it as `class SettingsConfig extends BaseSettingsConfig` with `override`
 *           members only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0146 as amended; ADR 0213.
 */
import { Config } from "@stackra/config";

import { SettingsConfigOptions } from "#core/schemas/settings-config-options.schema";

/**
 * The settings' configuration.
 *
 * @example
 * const config = buildConfig(SettingsConfig, { values: { store: "postgres" } });
 */
export class SettingsConfig extends Config({ schema: SettingsConfigOptions }) {}
