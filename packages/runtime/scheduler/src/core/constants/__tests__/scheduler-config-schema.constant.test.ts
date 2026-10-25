/**
 * Stackra file contract:
 * Purpose: unit tests of `SCHEDULER_CONFIG_SCHEMA` and `SCHEDULE_DRIVERS`: the driver enum names every shipped
 *          `ScheduleDriver` driver once, by its file prefix; the catch-up window takes a duration from one minute to
 *          one day; the misfire field takes a `Misfire` code.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decisions 4 and 26); ADR 0263 (decision 9).
 */
import { Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { SCHEDULE_DRIVERS } from "#core/constants/schedule-drivers.constant";
import { SCHEDULER_CONFIG_SCHEMA } from "#core/constants/scheduler-config-schema.constant";
import { MemoryScheduleDriver } from "#core/drivers/memory-schedule.driver";
import { PostgresScheduleDriver } from "#node/drivers/postgres-schedule.driver";

/** `MemoryScheduleDriver` to `memory`: the class name less the port and kind, in lower case. */
const driverName = (type: { readonly name: string }): string =>
  type.name.replace(/ScheduleDriver$/, "").toLowerCase();

describe("SCHEDULER_CONFIG_SCHEMA", () => {
  it("names every shipped driver once, as the schema's driver enum", () => {
    expect([...SCHEDULE_DRIVERS]).toEqual(
      [PostgresScheduleDriver, MemoryScheduleDriver].map(driverName),
    );
    expect(SCHEDULER_CONFIG_SCHEMA.shape.driver.unwrap().options).toEqual([...SCHEDULE_DRIVERS]);
  });

  it("takes a catch-up window from one minute to one day", () => {
    for (const catchUpWindow of [Duration.minutes(1), Duration.hours(6), Duration.days(1)])
      expect(SCHEDULER_CONFIG_SCHEMA.parse({ catchUpWindow }).catchUpWindow).toBe(catchUpWindow);
    for (const catchUpWindow of [Duration.seconds(59), Duration.days(2), "1h", 60])
      expect(SCHEDULER_CONFIG_SCHEMA.safeParse({ catchUpWindow }).success).toBe(false);
  });

  it("takes a Misfire code", () => {
    expect(SCHEDULER_CONFIG_SCHEMA.parse({ misfire: "skip" }).misfire).toBe("skip");
    expect(SCHEDULER_CONFIG_SCHEMA.safeParse({ misfire: "later" }).success).toBe(false);
  });
});
