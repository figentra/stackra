/**
 * Stackra file contract:
 * Purpose: unit tests of the `LiveActivities` port: its drivers are instances of it, and it is keyed and typed.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0250; STA-1539.
 */
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { LiveActivities } from "#contracts/ports/live-activities.port";
import type { CapabilityResult } from "#contracts/types/capability-result.type";
import { MemoryLiveActivitiesDriver } from "#core/drivers/memory-live-activities.driver";

describe("LiveActivities", () => {
  it("is a port its drivers are instances of", () => {
    const activities = new MemoryLiveActivitiesDriver();
    expect(activities).toBeInstanceOf(LiveActivities);
    expect(activities).toBeInstanceOf(Port);
  });

  it("is keyed platform.LiveActivities and answers show with a capability result", () => {
    expectTypeOf<LiveActivities["~key"]>().toEqualTypeOf<"platform.LiveActivities">();
    expectTypeOf<LiveActivities["show"]>().returns.toEqualTypeOf<Promise<CapabilityResult>>();
    expectTypeOf<LiveActivities["pushToken"]>().returns.toEqualTypeOf<Promise<string | null>>();
  });
});
