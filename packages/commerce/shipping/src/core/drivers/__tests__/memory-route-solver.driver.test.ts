/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryRouteSolverDriver`: it is a `RouteSolver`; it fills vehicles first fit by compartment,
 *          waits for a window to open, keeps a stop out of a closed window or past the shift, never drops a stop, and
 *          gives every vehicle a route.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0266; ADR 0269; R3-SO-09; GRO-129.
 */
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { RouteSolver } from "#contracts/ports/route-solver.port";
import type { RouteVehicle } from "#contracts/types/route-vehicle.type";
import { MemoryRouteSolverDriver } from "#core/drivers/memory-route-solver.driver";

const at = { latitude: 1, longitude: 1 };
const shift = { from: "2026-10-25T08:00:00.000Z", to: "2026-10-25T10:00:00.000Z" };
const van: RouteVehicle = {
  vehicleId: "van",
  start: at,
  shift,
  capacity: { chilled: 2, ambient: 5 },
};
const bike: RouteVehicle = { vehicleId: "bike", start: at, shift, capacity: { ambient: 1 } };

describe("MemoryRouteSolverDriver", () => {
  it("is the RouteSolver port", () => {
    expect(Object.getPrototypeOf(RouteSolver)).toBe(Port);
    expect(new MemoryRouteSolverDriver()).toBeInstanceOf(RouteSolver);
  });

  it("places stops first fit, waits for windows and lists the rest", async () => {
    const plan = await new MemoryRouteSolverDriver().solve({
      vehicles: [van, bike],
      stops: [
        { stopId: "a", location: at, demand: { chilled: 2 }, serviceS: 300 },
        { stopId: "b", location: at, demand: { chilled: 1 } },
        {
          stopId: "c",
          location: at,
          demand: { ambient: 1 },
          window: { from: "2026-10-25T09:00:00.000Z", to: "2026-10-25T09:30:00.000Z" },
          serviceS: 60,
        },
        {
          stopId: "d",
          location: at,
          demand: {},
          window: { from: "2026-10-25T07:00:00.000Z", to: "2026-10-25T07:30:00.000Z" },
        },
        { stopId: "e", location: at, demand: { ambient: 1 }, serviceS: 7_200 },
      ],
    });
    expect(plan.unassigned).toEqual(["b", "d"]);
    expect(plan.routes).toEqual([
      {
        vehicleId: "van",
        visits: [
          {
            stopId: "a",
            arriveAt: "2026-10-25T08:00:00.000Z",
            departAt: "2026-10-25T08:05:00.000Z",
          },
          {
            stopId: "c",
            arriveAt: "2026-10-25T09:00:00.000Z",
            departAt: "2026-10-25T09:01:00.000Z",
          },
        ],
        distanceM: 0,
        durationS: 3_660,
      },
      {
        vehicleId: "bike",
        visits: [
          {
            stopId: "e",
            arriveAt: "2026-10-25T08:00:00.000Z",
            departAt: "2026-10-25T10:00:00.000Z",
          },
        ],
        distanceM: 0,
        durationS: 7_200,
      },
    ]);
  });

  it("gives an unused vehicle an empty route", async () => {
    const plan = await new MemoryRouteSolverDriver().solve({ vehicles: [bike], stops: [] });
    expect(plan).toEqual({
      routes: [{ vehicleId: "bike", visits: [], distanceM: 0, durationS: 0 }],
      unassigned: [],
    });
  });
});
