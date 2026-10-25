/**
 * Stackra file contract:
 * Purpose: unit tests of `SchedulerOptions` and its shipped schema: a shape registered with `SCHEDULER_CONFIG_SCHEMA`,
 *          whose initializers equal the schema's defaults and whose `driver` is typed as the `ScheduleDriver` driver
 *          names.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 19 and 26).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { Schema, schemaOf } from "@stackra/validation";

import { SCHEDULER_CONFIG_SCHEMA } from "#core/constants/scheduler-config-schema.constant";
import { SchedulerOptions } from "#core/schemas/scheduler-options.schema";

describe("SchedulerOptions", () => {
  it("is a shape registered with the shipped schema", () => {
    expect(new SchedulerOptions()).toBeInstanceOf(Schema);
    expect(schemaOf(SchedulerOptions)).toBe(SCHEDULER_CONFIG_SCHEMA);
  });

  it("has initializers equal to the shipped defaults", () => {
    expect({ ...new SchedulerOptions() }).toEqual(SCHEDULER_CONFIG_SCHEMA.parse({}));
    expect(SCHEDULER_CONFIG_SCHEMA.parse({})).toEqual({
      driver: "postgres",
      catchUpWindow: "PT1H",
      misfire: "catch_up",
    });
  });

  it("types driver as the ScheduleDriver driver names", () => {
    expectTypeOf<SchedulerOptions["driver"]>().toEqualTypeOf<"postgres" | "memory">();
  });
});
