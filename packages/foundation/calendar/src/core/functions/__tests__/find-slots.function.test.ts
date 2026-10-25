/**
 * Stackra file contract:
 * Purpose: unit tests of `findSlots`: starts stepped from each open window, busy blocks refused, processing gaps allowed over busy time, the limit, and refused input.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0366.
 */
import { describe, expect, it } from "@stackra/testing";

import { findSlots } from "#core/functions/find-slots.function";

const open = [{ start: "2026-01-04T06:00:00Z", end: "2026-01-04T08:00:00Z" }];

describe("findSlots", () => {
  it("steps through the open window", () => {
    const slots = findSlots({
      open,
      busy: [],
      segments: [{ minutes: 60, occupies: true }],
      step: 30,
    });
    expect(slots.map((slot) => slot.start)).toEqual([
      "2026-01-04T06:00:00.000Z",
      "2026-01-04T06:30:00.000Z",
      "2026-01-04T07:00:00.000Z",
    ]);
    expect(slots[0]?.end).toBe("2026-01-04T07:00:00.000Z");
  });

  it("refuses starts that hit busy time", () => {
    const busy = [{ start: "2026-01-04T06:30:00Z", end: "2026-01-04T07:00:00Z" }];
    const slots = findSlots({ open, busy, segments: [{ minutes: 30, occupies: true }], step: 30 });
    expect(slots.map((slot) => slot.start)).toEqual([
      "2026-01-04T06:00:00.000Z",
      "2026-01-04T07:00:00.000Z",
      "2026-01-04T07:30:00.000Z",
    ]);
  });

  it("lets a processing gap overlap busy time", () => {
    const busy = [{ start: "2026-01-04T06:30:00Z", end: "2026-01-04T07:00:00Z" }];
    const segments = [
      { minutes: 30, occupies: true },
      { minutes: 30, occupies: false },
      { minutes: 30, occupies: true },
    ];
    const slots = findSlots({ open, busy, segments, step: 30 });
    expect(slots).toEqual([{ start: "2026-01-04T06:00:00.000Z", end: "2026-01-04T07:30:00.000Z" }]);
  });

  it("stops at the limit", () => {
    expect(
      findSlots({
        open,
        busy: [],
        segments: [{ minutes: 15, occupies: true }],
        step: 15,
        limit: 2,
      }),
    ).toHaveLength(2);
  });

  it("refuses a bad step or segment", () => {
    expect(() =>
      findSlots({ open, busy: [], segments: [{ minutes: 15, occupies: true }], step: 0 }),
    ).toThrow(RangeError);
    expect(() => findSlots({ open, busy: [], segments: [], step: 15 })).toThrow(RangeError);
    expect(() =>
      findSlots({ open, busy: [], segments: [{ minutes: 1.5, occupies: true }], step: 15 }),
    ).toThrow(RangeError);
  });
});
