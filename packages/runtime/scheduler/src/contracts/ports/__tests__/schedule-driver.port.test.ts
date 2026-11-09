/**
 * Stackra file contract:
 * Purpose: unit tests of the `ScheduleDriver` port: a driver extends it, it is keyed `scheduler.ScheduleDriver`, and
 *          its watermarks are instants by key.
 * Boundary: test only; a null driver stands in for a real one.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0142; ADR 0148 (decision 5).
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { ScheduleDriver } from "#contracts/ports/schedule-driver.port";
import type { Schedule } from "#contracts/types/schedule.type";
import type { ScheduleClaim } from "#contracts/types/schedule-claim.type";

class NullScheduleDriver extends Driver(ScheduleDriver) {
  async add(): Promise<void> {}

  async remove(): Promise<boolean> {
    return false;
  }

  async schedules(): Promise<readonly Schedule[]> {
    return [];
  }

  async claim(): Promise<readonly ScheduleClaim[]> {
    return [];
  }

  async load(): Promise<Schedule | undefined> {
    return undefined;
  }

  async recordFire(): Promise<boolean> {
    return true;
  }

  async forgetFires(): Promise<void> {}

  transaction<T>(work: () => Promise<T>): Promise<T> {
    return work();
  }

  async watermarks(): Promise<ReadonlyMap<string, Date>> {
    return new Map();
  }

  async advance(): Promise<void> {}
}

describe("ScheduleDriver", () => {
  it("is a port a driver implements", async () => {
    const driver: ScheduleDriver = new NullScheduleDriver();
    expect(driver).toBeInstanceOf(ScheduleDriver);
    expect(driver).toBeInstanceOf(Port);
    await expect(driver.claim()).resolves.toEqual([]);
  });

  it("is keyed scheduler.ScheduleDriver", () => {
    expectTypeOf<ScheduleDriver["~key"]>().toEqualTypeOf<"scheduler.ScheduleDriver">();
    expectTypeOf<Awaited<ReturnType<ScheduleDriver["watermarks"]>>>().toEqualTypeOf<
      ReadonlyMap<string, Date>
    >();
  });

  it("claims a schedule by its id, owner and what decides its runs, never its input or scope", () => {
    expectTypeOf<keyof ScheduleClaim>().toEqualTypeOf<
      "id" | "ownerId" | "key" | "cron" | "timeZone" | "misfire" | "createdAt"
    >();
  });
});
