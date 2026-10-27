/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryDriveThroughLaneDriver`: it is a `DriveThroughLane`, shows and clears each lane's
 *          confirm board, streams car readings until a listener stops, and refuses the board calls with capability
 *          `window` for an offline lane.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0253; STA-965.
 */
import { describe, expect, it } from "@stackra/testing";

import { DriveThroughLane } from "#contracts/ports/drive-through-lane.port";
import type { CustomerDisplayView } from "#contracts/types/customer-display-view.type";
import { MemoryDriveThroughLaneDriver } from "#core/drivers/memory-drive-through-lane.driver";

const VIEW: CustomerDisplayView = {
  lines: [{ label: "2x Burger", amount: "SAR 36.00" }],
  total: "SAR 36.00",
  message: "Please drive forward",
};

describe("MemoryDriveThroughLaneDriver", () => {
  it("shows and clears a lane's confirm board", async () => {
    const lanes = new MemoryDriveThroughLaneDriver();
    expect(lanes).toBeInstanceOf(DriveThroughLane);
    expect(await lanes.probe("lane_1")).toEqual({ ok: true, data: undefined });
    expect(await lanes.confirm("lane_1", VIEW)).toEqual({ ok: true, data: undefined });
    expect(lanes.boards.get("lane_1")).toEqual(VIEW);
    expect(lanes.boards.has("lane_2")).toBe(false);
    expect(await lanes.clear("lane_1")).toEqual({ ok: true, data: undefined });
    expect(lanes.boards.has("lane_1")).toBe(false);
  });

  it("streams car readings until the listener stops", () => {
    const lanes = new MemoryDriveThroughLaneDriver();
    const seen: unknown[] = [];
    const stop = lanes.onCar((car) => seen.push(car));
    lanes.car("lane_1", true);
    lanes.car("lane_1", false);
    stop();
    lanes.car("lane_2", true);
    expect(seen).toEqual([
      { lane: "lane_1", isPresent: true },
      { lane: "lane_1", isPresent: false },
    ]);
  });

  it("refuses the board calls for an offline lane", async () => {
    const lanes = new MemoryDriveThroughLaneDriver();
    await lanes.confirm("lane_1", VIEW);
    lanes.offline.add("lane_1");
    const refused = { ok: false, error: { code: "unavailable", capability: "window" } };
    expect(await lanes.probe("lane_1")).toEqual(refused);
    expect(await lanes.confirm("lane_1", VIEW)).toEqual(refused);
    expect(await lanes.clear("lane_1")).toEqual(refused);
    expect(lanes.boards.get("lane_1")).toEqual(VIEW);
  });
});
