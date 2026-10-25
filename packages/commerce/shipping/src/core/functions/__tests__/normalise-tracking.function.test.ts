/**
 * Stackra file contract:
 * Purpose: unit tests of `normaliseTracking`: mapping through the connector's map, ordering by instant across offsets,
 *          a late older event not moving the state back, duplicates kept once, unknown codes reported once, an empty
 *          history, and the refusal of an unparseable instant.
 * Boundary: test only; the map is test data, never a real carrier's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0369 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { TrackingState } from "#contracts/enums/tracking-state.enum";
import type { TrackingMap } from "#contracts/types/tracking-map.type";
import { normaliseTracking } from "#core/functions/normalise-tracking.function";

const map: TrackingMap = {
  A: TrackingState.InTransit,
  B: TrackingState.OutForDelivery,
  C: TrackingState.Delivered,
};

describe("normaliseTracking", () => {
  it("maps codes and takes the state of the latest event", () => {
    const timeline = normaliseTracking(
      [
        { code: "B", at: "2026-10-25T08:00:00Z" },
        { code: "A", at: "2026-10-24T08:00:00Z", description: "Picked up" },
      ],
      map,
    );
    expect(timeline.state).toBe(TrackingState.OutForDelivery);
    expect(timeline.events.map((event) => event.code)).toEqual(["A", "B"]);
    expect(timeline.events[0]).toEqual({
      code: "A",
      at: "2026-10-24T08:00:00Z",
      description: "Picked up",
      state: TrackingState.InTransit,
    });
  });

  it("orders by instant, not by text, across offsets", () => {
    const timeline = normaliseTracking(
      [
        { code: "C", at: "2026-10-25T10:00:00+03:00" }, // 07:00Z
        { code: "B", at: "2026-10-25T08:00:00Z" },
      ],
      map,
    );
    expect(timeline.state).toBe(TrackingState.OutForDelivery);
  });

  it("does not move back on a late webhook for an older event", () => {
    const timeline = normaliseTracking(
      [
        { code: "C", at: "2026-10-25T12:00:00Z" },
        { code: "A", at: "2026-10-24T08:00:00Z" },
      ],
      map,
    );
    expect(timeline.state).toBe(TrackingState.Delivered);
  });

  it("keeps a code at one instant once and input order on a tie", () => {
    const timeline = normaliseTracking(
      [
        { code: "A", at: "2026-10-25T08:00:00Z" },
        { code: "A", at: "2026-10-25T11:00:00+03:00" },
        { code: "B", at: "2026-10-25T08:00:00Z" },
      ],
      map,
    );
    expect(timeline.events.map((event) => event.code)).toEqual(["A", "B"]);
    expect(timeline.state).toBe(TrackingState.OutForDelivery);
  });

  it("reports unknown codes once, in first-seen order, and never guesses them", () => {
    const timeline = normaliseTracking(
      [
        { code: "X", at: "2026-10-25T09:00:00Z" },
        { code: "A", at: "2026-10-25T08:00:00Z" },
        { code: "toString", at: "2026-10-25T10:00:00Z" },
        { code: "X", at: "2026-10-25T11:00:00Z" },
      ],
      map,
    );
    expect(timeline.unmapped).toEqual(["X", "toString"]);
    expect(timeline.state).toBe(TrackingState.InTransit);
  });

  it("gives a null state for no mapped events", () => {
    expect(normaliseTracking([], map)).toEqual({ state: null, events: [], unmapped: [] });
  });

  it("refuses an instant that is not a date", () => {
    expect(() => normaliseTracking([{ code: "A", at: "yesterday" }], map)).toThrow(RangeError);
  });
});
