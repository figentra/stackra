/**
 * Stackra file contract:
 * Purpose: unit tests of `OutboxConfig`: a configuration keyed `outbox` whose `driver` defaults to `postgres`, takes a
 *          runway value and a host override, and refuses a driver no one ships; `batchWindowSeconds`
 *          defaults to 0 and takes whole seconds up to 60.
 * Boundary: test only; builds the configuration through @stackra/config.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 4 and 19); ADR 0146 as amended.
 */
import { buildConfig, Config, ConfigInvalidError, configKey } from "@stackra/config";
import type { DriverName } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { OutboxConfig } from "#config/outbox.config";
import type { OutboxDriver } from "#contracts/ports/outbox-driver.port";
import { OUTBOX_CONFIG_SCHEMA } from "#core/constants/outbox-config-schema.constant";

/** A host override, under the plain name with the package class aliased. */
const BaseOutboxConfig = OutboxConfig;

class HostOutboxConfig extends BaseOutboxConfig {
  override driver: DriverName<OutboxDriver> = "memory";
}

describe("OutboxConfig", () => {
  it("is a configuration keyed outbox, an override inheriting the key", () => {
    expect(new OutboxConfig()).toBeInstanceOf(Config);
    expect(configKey(OutboxConfig, "outbox")).toBe("outbox");
    expect(configKey(HostOutboxConfig, "outbox")).toBe("outbox");
  });

  it("types its field on the class and builds with the default", () => {
    const config = buildConfig(OutboxConfig);
    expectTypeOf(config.driver).toEqualTypeOf<DriverName<OutboxDriver>>();
    expect({ ...config }).toEqual(OUTBOX_CONFIG_SCHEMA.parse({}));
    expect(config.driver).toBe("postgres");
    expect(config.batchWindowSeconds).toBe(0);
    expect(config.changeRetentionDays).toBe(7);
    expect(config.pruneAfterDays).toBe(30);
  });

  it("takes a runway value and a host override", () => {
    expect(buildConfig(OutboxConfig, { values: { driver: "memory" } }).driver).toBe("memory");
    expect(buildConfig(HostOutboxConfig).driver).toBe("memory");
  });

  it("takes a batch window of 0 to 60 whole seconds", () => {
    expect(
      buildConfig(OutboxConfig, { values: { batchWindowSeconds: 5 } }).batchWindowSeconds,
    ).toBe(5);
    expect(() => buildConfig(OutboxConfig, { values: { batchWindowSeconds: 61 } })).toThrow(
      ConfigInvalidError,
    );
    expect(() => buildConfig(OutboxConfig, { values: { batchWindowSeconds: 1.5 } })).toThrow(
      ConfigInvalidError,
    );
  });

  it("keeps changes 1 to 400 whole days", () => {
    expect(
      buildConfig(OutboxConfig, { values: { changeRetentionDays: 30 } }).changeRetentionDays,
    ).toBe(30);
    expect(() => buildConfig(OutboxConfig, { values: { changeRetentionDays: 0 } })).toThrow(
      ConfigInvalidError,
    );
  });

  it("refuses a driver no one ships", () => {
    expect(() =>
      buildConfig(OutboxConfig, { values: { driver: "kafka" as DriverName<OutboxDriver> } }),
    ).toThrow(ConfigInvalidError);
  });
});
