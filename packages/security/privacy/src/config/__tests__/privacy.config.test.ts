/**
 * Stackra file contract:
 * Purpose: unit tests of `PrivacyConfig`: a configuration keyed `privacy` that builds with the shipped defaults
 *          (repository store, seven-day exports), reads the store from `STACKRA_PRIVACY_STORE`, takes a host
 *          override, and refuses an unknown store or an export window outside 1 to 30 days.
 * Boundary: test only; pure configuration building, no container.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0146 as amended; ADR 0189 (decision 1).
 */
import { buildConfig, Config, ConfigInvalidError, configKey } from "@stackra/config";
import type { DriverName } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { PrivacyConfig } from "#config/privacy.config";
import type { PersonalDataStore } from "#contracts/ports/personal-data-store.port";
import { PRIVACY_CONFIG_SCHEMA } from "#core/constants/privacy-config-schema.constant";

/** A host override, under the plain name with the package class aliased. */
const BasePrivacyConfig = PrivacyConfig;

class HostPrivacyConfig extends BasePrivacyConfig {
  override exportTtlDays = 3;
}

describe("PrivacyConfig", () => {
  it("is a configuration keyed privacy, an override inheriting the key", () => {
    expect(new PrivacyConfig()).toBeInstanceOf(Config);
    expect(configKey(PrivacyConfig, "privacy")).toBe("privacy");
    expect(configKey(HostPrivacyConfig, "privacy")).toBe("privacy");
  });

  it("builds with the shipped defaults", () => {
    const config = buildConfig(PrivacyConfig);
    expectTypeOf(config.store).toEqualTypeOf<DriverName<PersonalDataStore>>();
    expect({ ...config }).toEqual(PRIVACY_CONFIG_SCHEMA.parse({}));
    expect(config.store).toBe("repository");
    expect(config.exportTtlDays).toBe(7);
    expect(config.exportFolder).toBe("privacy/exports");
  });

  it("reads the store from the environment and takes a host override", () => {
    expect(buildConfig(PrivacyConfig, { env: { STACKRA_PRIVACY_STORE: "memory" } }).store).toBe(
      "memory",
    );
    expect(buildConfig(HostPrivacyConfig).exportTtlDays).toBe(3);
  });

  it("refuses a store no one ships and a window outside 1 to 30 days", () => {
    expect(() =>
      buildConfig(PrivacyConfig, { values: { store: "s3" as DriverName<PersonalDataStore> } }),
    ).toThrow(ConfigInvalidError);
    expect(() => buildConfig(PrivacyConfig, { values: { exportTtlDays: 0 } })).toThrow(
      ConfigInvalidError,
    );
    expect(() => buildConfig(PrivacyConfig, { values: { exportTtlDays: 31 } })).toThrow(
      ConfigInvalidError,
    );
  });
});
