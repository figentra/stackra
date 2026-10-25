/**
 * Stackra file contract:
 * Purpose: unit tests of the scheduler's pure functions: `moveEvent` snaps, keeps the length, stays inside the hours
 *          and changes column; `resizeEvent` snaps, keeps one step at least and stays inside the hours; `busySpans`
 *          leaves processing gaps free; `eventLanes` puts overlapping busy time side by side and lets a booking sit in
 *          another's processing gap.
 * Boundary: test only; the hours and steps are test data.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0310 (decision 3).
 */
import { busySpans } from "#core/functions/busy-spans.function";
import { eventLanes } from "#core/functions/event-lanes.function";
import { moveEvent } from "#core/functions/move-event.function";
import { resizeEvent } from "#core/functions/resize-event.function";

const bounds = { startMinute: 540, endMinute: 1080, slotMinutes: 15 };
const booking = {
  id: "a",
  title: "Cut",
  day: "2026-11-02",
  resource: "sara",
  start: 600,
  end: 660,
};

describe("scheduler math", () => {
  it("moves by snapped minutes, keeps the length and stays inside the hours", () => {
    expect(moveEvent(booking, 17, bounds)).toMatchObject({ start: 615, end: 675 });
    expect(moveEvent(booking, -500, bounds)).toMatchObject({ start: 540, end: 600 });
    expect(moveEvent(booking, 900, bounds)).toMatchObject({ start: 1020, end: 1080 });
    expect(moveEvent(booking, 0, bounds, { day: "2026-11-03", resource: "lina" })).toMatchObject({
      day: "2026-11-03",
      resource: "lina",
      start: 600,
    });
  });

  it("resizes by snapped minutes, one step at least, inside the hours", () => {
    expect(resizeEvent(booking, 23, bounds)).toMatchObject({ start: 600, end: 690 });
    expect(resizeEvent(booking, -120, bounds)).toMatchObject({ end: 615 });
    expect(resizeEvent(booking, 1_000, bounds)).toMatchObject({ end: 1080 });
  });

  it("leaves processing gaps free", () => {
    const colour = {
      ...booking,
      end: 690,
      segments: [
        { offset: 0, duration: 30, kind: "busy" as const },
        { offset: 30, duration: 45, kind: "processing" as const },
        { offset: 75, duration: 15, kind: "busy" as const },
      ],
    };
    expect(busySpans(colour)).toEqual([
      [600, 630],
      [675, 690],
    ]);
    expect(busySpans(booking)).toEqual([[600, 660]]);
    const inGap = { ...booking, id: "b", start: 630, end: 675 };
    expect(eventLanes([colour, inGap])).toEqual(
      new Map([
        ["a", { lane: 0, lanes: 1 }],
        ["b", { lane: 0, lanes: 1 }],
      ]),
    );
  });

  it("puts overlapping busy time side by side", () => {
    const other = { ...booking, id: "b", start: 630, end: 700 };
    const later = { ...booking, id: "c", start: 720, end: 750 };
    expect(eventLanes([other, booking, later])).toEqual(
      new Map([
        ["a", { lane: 0, lanes: 2 }],
        ["b", { lane: 1, lanes: 2 }],
        ["c", { lane: 0, lanes: 1 }],
      ]),
    );
  });
});
