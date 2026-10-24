/**
 * Stackra file contract:
 * Purpose: unit and type tests of `LockingConfig`: a configuration over `LockingOptions` keyed `locking` (the key the
 *          package's wiring selects the driver by, `config:locking.driver`), built with its default, a runway value
 *          and a host override, and refusing a driver no one ships.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 19 and
 *                     20).
 */
import { buildConfig, Config, ConfigInvalidError, configKey } from "@stackra/config";
import type { DriverName } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { LockingConfig } from "#config/locking.config";
import type { LockDriver } from "#contracts/ports/lock-driver.port";
import { LOCKING_CONFIG_SCHEMA } from "#core/constants/locking-config-schema.constant";

/** A host override, under the plain name with the package class aliased. */
const BaseLockingConfig = LockingConfig;

class HostLockingConfig extends BaseLockingConfig {
  override driver: DriverName<LockDriver> = "memory";
}

describe("LockingConfig", () => {
  it("is a configuration keyed locking, an override inheriting the key", () => {
    expect(new LockingConfig()).toBeInstanceOf(Config);
    expect(configKey(LockingConfig, "locking")).toBe("locking");
    expect(configKey(HostLockingConfig, "locking")).toBe("locking");
  });

  it("types its field on the class and builds with the default", () => {
    const config = buildConfig(LockingConfig);
    expectTypeOf(config.driver).toEqualTypeOf<DriverName<LockDriver>>();
    expect({ ...config }).toEqual(LOCKING_CONFIG_SCHEMA.parse({}));
    expect(config.driver).toBe("postgres");
  });

  it("takes a runway value and a host override", () => {
    expect(buildConfig(LockingConfig, { values: { driver: "memory" } }).driver).toBe("memory");
    expect(buildConfig(HostLockingConfig).driver).toBe("memory");
  });

  it("refuses a driver no one ships", () => {
    expect(() =>
      buildConfig(LockingConfig, {
        values: { driver: "valkey" as DriverName<LockDriver> },
      }),
    ).toThrow(ConfigInvalidError);
  });
});
