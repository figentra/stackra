/**
 * Stackra file contract:
 * Purpose: type tests of the `DriverRegistry` entry of `ScheduleDriver`: `DriverName<ScheduleDriver>` is exactly the
 *          shipped driver names.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0263 (decision 9).
 */
import "#core/types/schedule-driver-names.type";

import type { DriverName, DriverRegistry } from "@stackra/container";
import { describe, expectTypeOf, it } from "@stackra/testing";

import type { ScheduleDriver } from "#contracts/ports/schedule-driver.port";

describe("DriverRegistry['scheduler.ScheduleDriver']", () => {
  it("narrows DriverName<ScheduleDriver> to the shipped drivers", () => {
    expectTypeOf<DriverName<ScheduleDriver>>().toEqualTypeOf<"postgres" | "memory">();
    expectTypeOf<DriverRegistry["scheduler.ScheduleDriver"]>().toEqualTypeOf<
      DriverName<ScheduleDriver>
    >();
  });
});
