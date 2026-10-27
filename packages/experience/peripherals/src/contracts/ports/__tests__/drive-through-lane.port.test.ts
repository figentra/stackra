/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `DriveThroughLane` port: a port base keyed `peripherals.DriveThroughLane` whose
 *          drivers are instances of it, with its board calls, the car listener and the car shape.
 * Boundary: test only; the driver is the package's memory driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0253; ADR 0294 (decision 16); STA-965.
 */
import { Port } from "@stackra/contracts";
import type { CapabilityResult } from "@stackra/platform/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { DriveThroughLane } from "#contracts/ports/drive-through-lane.port";
import type { CustomerDisplayView } from "#contracts/types/customer-display-view.type";
import type { LaneCar } from "#contracts/types/lane-car.type";
import { MemoryDriveThroughLaneDriver } from "#core/drivers/memory-drive-through-lane.driver";

describe("DriveThroughLane", () => {
  it("is a port its drivers are instances of", () => {
    const lanes = new MemoryDriveThroughLaneDriver();
    expect(lanes).toBeInstanceOf(DriveThroughLane);
    expect(lanes).toBeInstanceOf(Port);
  });

  it("is keyed peripherals.DriveThroughLane and types its calls", () => {
    expectTypeOf<DriveThroughLane["~key"]>().toEqualTypeOf<"peripherals.DriveThroughLane">();
    expectTypeOf<DriveThroughLane["confirm"]>().parameters.toEqualTypeOf<
      [lane: string, view: CustomerDisplayView]
    >();
    expectTypeOf<DriveThroughLane["clear"]>().returns.toEqualTypeOf<Promise<CapabilityResult>>();
    expectTypeOf<DriveThroughLane["onCar"]>().parameters.toEqualTypeOf<
      [listener: (car: LaneCar) => void]
    >();
    expectTypeOf<LaneCar>().toEqualTypeOf<{ readonly lane: string; readonly isPresent: boolean }>();
  });
});
