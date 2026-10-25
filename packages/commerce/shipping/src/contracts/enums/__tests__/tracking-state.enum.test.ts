/**
 * Stackra file contract:
 * Purpose: unit tests of `TrackingState`: its snake_case codes in order, and exactly delivered, returned and cancelled
 *          marked terminal.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0231; ADR 0369 (decision 4).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { TrackingState } from "#contracts/enums/tracking-state.enum";

describe("TrackingState", () => {
  it("has its snake_case codes in order", () => {
    expect(Enum.values(TrackingState)).toEqual([
      "label_created",
      "in_transit",
      "out_for_delivery",
      "ready_for_pickup",
      "delivered",
      "delivery_failed",
      "returning_to_origin",
      "returned",
      "cancelled",
      "exception",
    ]);
  });

  it("marks only the end states terminal", () => {
    const terminal = Enum.values(TrackingState).filter(
      (state) => Enum.meta(TrackingState, state).terminal,
    );
    expect(terminal).toEqual(["delivered", "returned", "cancelled"]);
  });
});
