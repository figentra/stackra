/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryLiveActivitiesDriver`: a show starts or updates by reference, an end drops it once,
 *          and an unavailable target refuses.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; STA-1539.
 */
import { describe, expect, it } from "@stackra/testing";

import type { ActivityProgress } from "#contracts/types/activity-progress.type";
import { MemoryLiveActivitiesDriver } from "#core/drivers/memory-live-activities.driver";

const ORDER: ActivityProgress = {
  reference: "order_1042",
  title: "Order 1042",
  status: "Being prepared",
  step: 1,
  steps: 4,
};

describe("MemoryLiveActivitiesDriver", () => {
  it("starts, updates and ends an activity by reference", async () => {
    const activities = new MemoryLiveActivitiesDriver();
    expect(await activities.show(ORDER)).toEqual({ ok: true, data: undefined });
    await activities.show({ ...ORDER, step: 2, status: "On the way" });
    expect(activities.shown.get("order_1042")?.step).toBe(2);
    await activities.end("order_1042");
    await activities.end("order_1042");
    expect(activities.shown.size).toBe(0);
    expect(activities.ended).toEqual(["order_1042"]);
  });

  it("refuses as unavailable on a target without Live Activities", async () => {
    const activities = new MemoryLiveActivitiesDriver();
    activities.isAvailable = false;
    expect(await activities.show(ORDER)).toEqual({
      ok: false,
      error: { code: "unavailable", capability: "live_activity" },
    });
    expect(activities.shown.size).toBe(0);
  });
});
