/**
 * Stackra file contract:
 * Purpose: proves the pure helpers of the second chart wave: heat levels and the heatmap grid, the calendar's weeks
 *          and the locale's first weekday, the waterfall's floating bars, and the gauge's angles.
 * Boundary: pure functions, no DOM.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
import { calendarWeeksOf } from "#core/functions/calendar-weeks-of.function";
import { gaugeAngleOf } from "#core/functions/gauge-angle-of.function";
import { heatLevelOf } from "#core/functions/heat-level-of.function";
import { heatmapGridOf } from "#core/functions/heatmap-grid-of.function";
import { waterfallRowsOf } from "#core/functions/waterfall-rows-of.function";
import { weekStartOf } from "#core/functions/week-start-of.function";

describe("heatLevelOf", () => {
  it("leaves nothing at 0 and spreads values over four shades", () => {
    expect(heatLevelOf(null, 0, 10)).toBe(0);
    expect(heatLevelOf(0, 0, 10)).toBe(0);
    expect(heatLevelOf(1, 0, 10)).toBe(1);
    expect(heatLevelOf(6, 0, 10)).toBe(3);
    expect(heatLevelOf(10, 0, 10)).toBe(4);
    expect(heatLevelOf(5, 5, 5)).toBe(4);
  });
});

describe("heatmapGridOf", () => {
  it("lays rows out in first-seen order with gaps as null", () => {
    const grid = heatmapGridOf(
      [
        { day: "Mon", hour: "9", n: 3 },
        { day: "Mon", hour: "10", n: 7 },
        { day: "Tue", hour: "10", n: null },
      ],
      "hour",
      "day",
      "n",
    );
    expect(grid).toEqual({
      columns: ["9", "10"],
      rows: ["Mon", "Tue"],
      cells: [
        [3, 7],
        [null, null],
      ],
      min: 3,
      max: 7,
    });
  });
});

describe("calendarWeeksOf", () => {
  it("pads the first and last weeks and adds values on the same day", () => {
    // 1 October 2026 is a Thursday.
    const weeks = calendarWeeksOf(
      [
        { date: "2026-10-01", value: 2 },
        { date: "2026-10-01T18:00:00Z", value: 1 },
        { date: "2026-10-05", value: 4 },
      ],
      "2026-10-01",
      "2026-10-07",
      0,
    );
    expect(weeks).toHaveLength(2);
    expect(weeks[0]?.[0]).toEqual({ date: "2026-09-27", value: null, isInRange: false });
    expect(weeks[0]?.[4]).toEqual({ date: "2026-10-01", value: 3, isInRange: true });
    expect(weeks[1]?.[1]).toEqual({ date: "2026-10-05", value: 4, isInRange: true });
    expect(weeks[1]?.[4]?.isInRange).toBe(false);
    // A Saturday start moves Thursday to the sixth row.
    expect(calendarWeeksOf([], "2026-10-01", "2026-10-01", 6)[0]?.[5]?.date).toBe("2026-10-01");
  });

  it("knows the first weekday of a locale", () => {
    expect(weekStartOf("de")).toBe(1);
    expect(weekStartOf("en-US")).toBe(0);
    expect([0, 6]).toContain(weekStartOf("ar-SA"));
  });
});

describe("waterfallRowsOf", () => {
  it("floats each step from the running total and closes on the end total", () => {
    const rows = waterfallRowsOf(
      { label: "Q3", value: 100 },
      [
        { key: "up", label: "Up", value: 30 },
        { key: "down", label: "Down", value: -50 },
      ],
      "Q4",
    );
    expect(rows.map((row) => [row.kind, row.low, row.high, row.total])).toEqual([
      ["total", 0, 100, 100],
      ["up", 100, 130, 130],
      ["down", 80, 130, 80],
      ["total", 0, 80, 80],
    ]);
    expect(rows.at(-1)?.label).toBe("Q4");
  });
});

describe("gaugeAngleOf", () => {
  it("maps the range onto the three-quarter ring and clamps outside it", () => {
    expect(gaugeAngleOf(0, 0, 100)).toBe(-135);
    expect(gaugeAngleOf(50, 0, 100)).toBe(0);
    expect(gaugeAngleOf(100, 0, 100)).toBe(135);
    expect(gaugeAngleOf(150, 0, 100)).toBe(135);
    expect(gaugeAngleOf(5, 10, 10)).toBe(-135);
  });
});
