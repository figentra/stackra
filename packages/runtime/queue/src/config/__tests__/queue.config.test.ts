/**
 * Stackra file contract:
 * Purpose: unit tests of `QueueConfig`: a configuration keyed `queue` whose `driver` defaults to `postgres`, takes a
 *          runway value and a host override, and refuses a driver no one ships.
 * Boundary: test only; builds the configuration through @stackra/config.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 4 and 19); ADR 0146 as amended.
 */
import { buildConfig, Config, ConfigInvalidError, configKey } from "@stackra/config";
import type { DriverName } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { QueueConfig } from "#config/queue.config";
import type { QueueDriver } from "#contracts/ports/queue-driver.port";
import { QUEUE_CONFIG_SCHEMA } from "#core/constants/queue-config-schema.constant";

/** A host override, under the plain name with the package class aliased. */
const BaseQueueConfig = QueueConfig;

class HostQueueConfig extends BaseQueueConfig {
  override driver: DriverName<QueueDriver> = "memory";
}

describe("QueueConfig", () => {
  it("is a configuration keyed queue, an override inheriting the key", () => {
    expect(new QueueConfig()).toBeInstanceOf(Config);
    expect(configKey(QueueConfig, "queue")).toBe("queue");
    expect(configKey(HostQueueConfig, "queue")).toBe("queue");
  });

  it("types its field on the class and builds with the default", () => {
    const config = buildConfig(QueueConfig);
    expectTypeOf(config.driver).toEqualTypeOf<DriverName<QueueDriver>>();
    expect({ ...config }).toEqual(QUEUE_CONFIG_SCHEMA.parse({}));
    expect(config.driver).toBe("postgres");
  });

  it("takes a runway value and a host override", () => {
    expect(buildConfig(QueueConfig, { values: { driver: "memory" } }).driver).toBe("memory");
    expect(buildConfig(HostQueueConfig).driver).toBe("memory");
  });

  it("refuses a driver no one ships", () => {
    expect(() =>
      buildConfig(QueueConfig, { values: { driver: "valkey" as DriverName<QueueDriver> } }),
    ).toThrow(ConfigInvalidError);
  });
});
