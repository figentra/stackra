/**
 * Stackra file contract:
 * Purpose: proves `timelineDaysOf` groups consecutive entries of one day, counts days back from `now` in the given
 *          time zone (Riyadh's midnight, not UTC's), and keeps the order given.
 * Boundary: pure function.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); STA-1371.
 */
import { timelineDaysOf } from "#core/functions/timeline-days-of.function";

describe("timelineDaysOf", () => {
  it("groups by day in the time zone and counts back from now", () => {
    const now = new Date("2026-10-29T09:00:00+03:00");
    const days = timelineDaysOf(
      [
        { id: "a", title: "a", at: "2026-10-29T08:10:00+03:00" },
        { id: "b", title: "b", at: "2026-10-29T00:30:00+03:00" },
        { id: "c", title: "c", at: "2026-10-28T23:50:00+03:00" },
        { id: "d", title: "d", at: "2026-10-20T12:00:00+03:00" },
      ],
      now,
      "Asia/Riyadh",
    );
    expect(days.map((day) => [day.key, day.daysAgo, day.items.map((item) => item.id)])).toEqual([
      ["2026-10-29", 0, ["a", "b"]],
      ["2026-10-28", 1, ["c"]],
      ["2026-10-20", 9, ["d"]],
    ]);
  });
});
