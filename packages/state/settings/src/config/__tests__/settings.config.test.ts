/**
 * Stackra file contract:
 * Purpose: unit tests of `SettingsConfig`: keyed `settings`, its defaults equal to `SettingsConfigOptions`'
 *          initializers, `store` and `floors` default to `memory`, take a named driver and nothing else.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 26).
 */
import { buildConfig, configKey } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";
import { schemaOf } from "@stackra/validation";

import { SettingsConfig } from "#config/settings.config";
import { SETTINGS_CONFIG_SCHEMA } from "#core/constants/settings-config-schema.constant";
import { SettingsConfigOptions } from "#core/schemas/settings-config-options.schema";

describe("SettingsConfig", () => {
  it("is keyed settings with defaults equal to the initializers", () => {
    expect(configKey(SettingsConfig, "settings")).toBe("settings");
    expect(schemaOf(SettingsConfigOptions)).toBe(SETTINGS_CONFIG_SCHEMA);
    expect({ ...new SettingsConfigOptions() }).toEqual(SETTINGS_CONFIG_SCHEMA.parse({}));
  });

  it("picks the SettingValueStore driver: memory by default, postgres by config, nothing else", () => {
    expect(buildConfig(SettingsConfig).store).toBe("memory");
    expect(buildConfig(SettingsConfig, { values: { store: "postgres" } }).store).toBe("postgres");
    expect(SETTINGS_CONFIG_SCHEMA.safeParse({ store: "redis" }).success).toBe(false);
  });

  it("picks the SettingFloorSource driver: memory by default, the named driver by config, nothing else", () => {
    expect(buildConfig(SettingsConfig).floors).toBe("memory");
    expect(
      buildConfig(SettingsConfig, { values: { floors: "registered_floor_guard" } }).floors,
    ).toBe("registered_floor_guard");
    expect(buildConfig(SettingsConfig, { values: { floors: "market_pack" } }).floors).toBe(
      "market_pack",
    );
    expect(SETTINGS_CONFIG_SCHEMA.safeParse({ floors: "file" }).success).toBe(false);
  });
});
