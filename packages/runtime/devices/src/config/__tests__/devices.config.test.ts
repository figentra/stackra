/**
 * Stackra file contract:
 * Purpose: unit tests of `DevicesConfig`: a configuration over `DevicesOptions` keyed `devices`, built with its
 *          defaults, a host override and a runway values layer, and refusing a value its schema refuses.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 19,
 *                     20 and 26).
 */
import { buildConfig, Config, configKey } from "@stackra/config";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { DevicesConfig } from "#config/devices.config";
import { DEVICES_CONFIG_SCHEMA } from "#core/constants/devices-config-schema.constant";

/** A host's override, under the plain name with the package class aliased. */
const BaseDevicesConfig = DevicesConfig;

class KioskDevicesConfig extends BaseDevicesConfig {
  override hubUrl: string | null = "https://hub.example.com";
}

describe("DevicesConfig", () => {
  it("is a configuration keyed devices, an override inheriting the key", () => {
    expect(new DevicesConfig()).toBeInstanceOf(Config);
    expect(configKey(DevicesConfig, "devices")).toBe("devices");
    expect(configKey(KioskDevicesConfig, "devices")).toBe("devices");
  });

  it("types its fields on the class and builds with the defaults", () => {
    const config = buildConfig(DevicesConfig);
    expectTypeOf(config.hubUrl).toEqualTypeOf<string | null>();
    expectTypeOf(config.attempts).toEqualTypeOf<number>();
    expect({ ...config }).toEqual(DEVICES_CONFIG_SCHEMA.parse({}));
    expect(config.hubUrl).toBeNull();
  });

  it("applies a host override and a runway values layer", () => {
    expect(buildConfig(KioskDevicesConfig).hubUrl).toBe("https://hub.example.com");
    const config = buildConfig(DevicesConfig, {
      values: { hubUrl: "https://hub.test", timeoutMs: 2000, attempts: 1 },
    });
    expect(config).toMatchObject({ hubUrl: "https://hub.test", timeoutMs: 2000, attempts: 1 });
  });

  it("refuses a URL that is not one and attempts out of range", () => {
    expect(() => buildConfig(DevicesConfig, { values: { hubUrl: "hub" } })).toThrow();
    expect(() => buildConfig(DevicesConfig, { values: { attempts: 0 } })).toThrow();
  });
});
