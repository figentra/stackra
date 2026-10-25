/**
 * Stackra file contract:
 * Purpose: unit tests of `SCHEDULER_TESTING_PLUGIN`: named after the package, it makes a compiled app's
 *          `SchedulerService` the current one, clears it for an app that binds none, and adds no member to the app.
 * Boundary: test only; calls the plugin with stand-in testing apps.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3).
 */
import type { TestingApp } from "@stackra/container/testing";
import { describe, expect, it } from "@stackra/testing";

import type { SchedulerService } from "#core/index";
import { CURRENT_SCHEDULER } from "#testing/constants/current-scheduler.constant";
import { SCHEDULER_TESTING_PLUGIN } from "#testing/constants/scheduler-testing-plugin.constant";

/** A testing app that binds `scheduler`, or nothing. */
function appWith(scheduler?: SchedulerService): TestingApp {
  return {
    has: () => scheduler !== undefined,
    get: () => scheduler,
  } as unknown as TestingApp;
}

describe("SCHEDULER_TESTING_PLUGIN", () => {
  it("is named after the package", () => {
    expect(SCHEDULER_TESTING_PLUGIN.name).toBe("@stackra/scheduler");
  });

  it("makes the app's scheduler current, and clears it for an app with none", () => {
    const scheduler = { tick: async () => undefined } as unknown as SchedulerService;
    expect(SCHEDULER_TESTING_PLUGIN.app?.(appWith(scheduler))).toEqual({});
    expect(CURRENT_SCHEDULER.value).toBe(scheduler);
    SCHEDULER_TESTING_PLUGIN.app?.(appWith());
    expect(CURRENT_SCHEDULER.value).toBeUndefined();
  });
});
