/**
 * Stackra file contract:
 * Purpose: unit tests of `SchedulerConfig`: a configuration keyed `scheduler` whose fields are typed on the class,
 *          built with the shipped defaults, set by runway or a host override, and refusing a driver no one ships and a
 *          catch-up window out of range.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0146 as amended; ADR 0294 (decisions 4 and 19).
 */
import { buildConfig, Config, ConfigInvalidError, configKey } from "@stackra/config";
import type { DriverName } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { SchedulerConfig } from "#config/scheduler.config";
import { Misfire } from "#contracts/index";
import type { ScheduleDriver } from "#contracts/index";
import { SCHEDULER_CONFIG_SCHEMA } from "#core/constants/scheduler-config-schema.constant";

/** A host override, under the plain name with the package class aliased. */
const BaseSchedulerConfig = SchedulerConfig;

class HostSchedulerConfig extends BaseSchedulerConfig {
  override driver: DriverName<ScheduleDriver> = "memory";

  override misfire: Misfire = Misfire.Once;
}

describe("SchedulerConfig", () => {
  it("is a configuration keyed scheduler, an override inheriting the key", () => {
    expect(new SchedulerConfig()).toBeInstanceOf(Config);
    expect(configKey(SchedulerConfig, "scheduler")).toBe("scheduler");
    expect(configKey(HostSchedulerConfig, "scheduler")).toBe("scheduler");
  });

  it("types its fields on the class and builds with the defaults", () => {
    const config = buildConfig(SchedulerConfig);
    expectTypeOf(config.driver).toEqualTypeOf<DriverName<ScheduleDriver>>();
    expectTypeOf(config.catchUpWindow).toEqualTypeOf<Duration>();
    expectTypeOf(config.misfire).toEqualTypeOf<Misfire>();
    expect({ ...config }).toEqual(SCHEDULER_CONFIG_SCHEMA.parse({}));
    expect(config.driver).toBe("postgres");
    expect(config.catchUpWindow).toBe(Duration.hours(1));
    expect(config.misfire).toBe(Misfire.CatchUp);
  });

  it("takes a runway value and a host override", () => {
    const config = buildConfig(SchedulerConfig, {
      values: { driver: "memory", catchUpWindow: Duration.hours(6) },
    });
    expect(config.driver).toBe("memory");
    expect(config.catchUpWindow).toBe(Duration.hours(6));
    expect(buildConfig(HostSchedulerConfig).misfire).toBe(Misfire.Once);
  });

  it("refuses a driver no one ships and a window shorter than a minute or longer than a day", () => {
    expect(() =>
      buildConfig(SchedulerConfig, {
        values: { driver: "valkey" as DriverName<ScheduleDriver> },
      }),
    ).toThrow(ConfigInvalidError);
    for (const catchUpWindow of [Duration.seconds(30), Duration.days(2)])
      expect(() => buildConfig(SchedulerConfig, { values: { catchUpWindow } })).toThrow(
        ConfigInvalidError,
      );
  });
});
