/**
 * Stackra file contract:
 * Purpose: proves the SchedulingBoard's layout: `schedulingColumnsOf` cuts the day, the locale's week and the timeline;
 *          `schedulingPositionOf` and `schedulingTimeAt` map moments to columns and back across hours not shown;
 *          `schedulingSnapOf` lands on a slot; `schedulingRowsOf` orders groups, parents and children and survives a
 *          loop; `schedulingPlacementsOf` layers bands, covers and lanes and fades a parent's items;
 *          `schedulingShadeOf` shades outside working time; `schedulingConflictsOf` finds the board's four reasons.
 * Boundary: pure functions; UTC, so no daylight-saving shift.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); shared modules step 4a (LEADER, 2026-11-09).
 */
import { CalendarDate } from "@internationalized/date";

import type { SchedulingBoardItem } from "#contracts/types/scheduling-board-item.type";
import type { SchedulingBoardResource } from "#contracts/types/scheduling-board-resource.type";
import { schedulingColumnsOf } from "#core/functions/scheduling-columns-of.function";
import { schedulingConflictsOf } from "#core/functions/scheduling-conflicts-of.function";
import { schedulingPlacementsOf } from "#core/functions/scheduling-placements-of.function";
import { schedulingPositionOf } from "#core/functions/scheduling-position-of.function";
import { schedulingRowsOf } from "#core/functions/scheduling-rows-of.function";
import { schedulingShadeOf } from "#core/functions/scheduling-shade-of.function";
import { schedulingSnapOf } from "#core/functions/scheduling-snap-of.function";
import { schedulingTimeAt } from "#core/functions/scheduling-time-at.function";

const day = new CalendarDate(2026, 11, 9);
const at = (hour: number, minute = 0, date = 9) => new Date(Date.UTC(2026, 10, date, hour, minute));
const options = {
  timeZone: "UTC",
  slotMinutes: 30,
  startHour: 8,
  endHour: 12,
  timelineDays: 14,
  locale: "en-US",
};
const columns = schedulingColumnsOf("day", day, options);
const item = (
  id: string,
  resourceIds: readonly string[],
  start: Date,
  end: Date,
  kind: SchedulingBoardItem["kind"] = "booking",
): SchedulingBoardItem => ({ id, resourceIds, start, end, kind, title: id });

/** Item `moving`, dragged from the half to `resourceId` over start to end. */
const draft = (resourceId: string, start: Date, end: Date) => ({
  change: "move" as const,
  itemId: "moving",
  fromResourceId: "half",
  resourceId,
  start,
  end,
});

describe("schedulingColumnsOf", () => {
  /** Eight half-hour slots from 08:00; the week opens on the locale's first day; the timeline is a column a day. */
  it("cuts the day, the week and the timeline", () => {
    expect(columns.map((column) => column.start.toISOString().slice(11, 16))).toEqual([
      "08:00",
      "08:30",
      "09:00",
      "09:30",
      "10:00",
      "10:30",
      "11:00",
      "11:30",
    ]);
    expect(columns.filter((column) => column.opensDay)).toHaveLength(1);
    const week = schedulingColumnsOf("week", day, options);
    expect([week.length, week[0]?.day.toString()]).toEqual([56, "2026-11-08"]);
    const timeline = schedulingColumnsOf("timeline", day, options);
    expect([timeline.length, timeline.at(-1)?.day.toString()]).toEqual([14, "2026-11-22"]);
  });
});

describe("schedulingPositionOf", () => {
  /** A moment maps to a fraction of its slot, and back; hours not shown fall on the next shown column. */
  it("maps moments to columns and back", () => {
    expect(schedulingPositionOf(at(9, 15), columns)).toBe(2.5);
    expect(schedulingTimeAt(2.5, columns)).toEqual(at(9, 15));
    expect(schedulingPositionOf(at(7), columns)).toBe(0);
    expect(schedulingPositionOf(at(13), columns)).toBe(8);
    const week = schedulingColumnsOf("week", day, options);
    expect(schedulingPositionOf(at(14, 0, 8), week)).toBe(8);
    expect(schedulingTimeAt(-1, columns)).toEqual(at(8));
    expect(schedulingTimeAt(99, columns)).toEqual(at(12));
    expect(schedulingTimeAt(1, [])).toEqual(new Date(0));
  });
});

describe("schedulingSnapOf", () => {
  /** 09:08 lands on 09:15 at a 15-minute step and 09:00 at a 30-minute one. */
  it("lands on the nearest slot", () => {
    expect(schedulingSnapOf(at(9, 8), 15, "UTC")).toEqual(at(9, 15));
    expect(schedulingSnapOf(at(9, 8), 30, "UTC")).toEqual(at(9));
  });
});

describe("schedulingRowsOf", () => {
  const resources: SchedulingBoardResource[] = [
    { id: "pitch", label: "Pitch", group: "North" },
    { id: "coach", label: "Coach" },
    { id: "half", label: "Half", parentId: "pitch", group: "South" },
    { id: "pool", label: "Pool", group: "South" },
    { id: "a", label: "A", parentId: "b" },
    { id: "b", label: "B", parentId: "a" },
  ];

  /** Ungrouped first, then each group; a child follows its parent whatever its group; a loop is broken. */
  it("orders groups, parents and children", () => {
    const rows = schedulingRowsOf(resources, new Set());
    expect(
      rows.map((row) =>
        row.kind === "group" ? `# ${row.group}` : `${row.resource.id}:${row.depth}`,
      ),
    ).toEqual(["coach:0", "a:0", "b:0", "# North", "pitch:0", "half:1", "# South", "pool:0"]);
    const half = rows.find((row) => row.kind === "resource" && row.resource.id === "half");
    expect(half?.kind === "resource" ? half.ancestors : []).toEqual(["pitch"]);
  });

  /** A collapsed group keeps its heading and hides its resources. */
  it("hides a collapsed group's resources", () => {
    const rows = schedulingRowsOf(resources, new Set(["North"]));
    expect(rows.some((row) => row.kind === "resource" && row.resource.id === "pitch")).toBe(false);
    expect(rows).toContainEqual({ kind: "group", group: "North", collapsed: true });
  });
});

describe("schedulingPlacementsOf", () => {
  /** Two overlapping bookings share lanes, a third waits for the first lane; a parent's item is inherited. */
  it("lays out lanes, bands, covers and inherited items", () => {
    const placed = schedulingPlacementsOf(
      [
        item("a", ["court"], at(8), at(9)),
        item("b", ["court"], at(8, 30), at(9, 30)),
        item("c", ["court"], at(9), at(10)),
        item("work", ["court"], at(8), at(12), "working_time"),
        item("closed", ["court"], at(11), at(13), "closure"),
        item("parent", ["hall"], at(10), at(11)),
        item("elsewhere", ["pool"], at(8), at(9)),
        item("hidden", ["court"], at(13), at(14)),
      ],
      "court",
      ["hall"],
      columns,
    );
    const by = (id: string) => placed.find((entry) => entry.item.id === id);
    expect(placed.map((entry) => entry.item.id).toSorted()).toEqual([
      "a",
      "b",
      "c",
      "closed",
      "parent",
      "work",
    ]);
    expect([by("a")?.lane, by("b")?.lane, by("c")?.lane, by("a")?.lanes]).toEqual([0, 1, 0, 2]);
    expect([by("work")?.layer, by("closed")?.layer, by("a")?.layer]).toEqual([
      "band",
      "cover",
      "block",
    ]);
    expect([by("closed")?.offset, by("closed")?.length, by("closed")?.clippedEnd]).toEqual([
      6,
      2,
      true,
    ]);
    expect([by("parent")?.inherited, by("a")?.inherited]).toEqual([true, false]);
  });
});

describe("schedulingShadeOf", () => {
  /** Nothing without working time; outside 09:00–11:00 with it; the whole row with none for it. */
  it("shades outside working time", () => {
    expect(schedulingShadeOf("court", undefined, columns)).toEqual([]);
    expect(
      schedulingShadeOf("court", [{ resourceId: "court", start: at(9), end: at(11) }], columns),
    ).toEqual([
      { offset: 0, length: 2 },
      { offset: 6, length: 2 },
    ]);
    expect(
      schedulingShadeOf("pool", [{ resourceId: "court", start: at(9), end: at(11) }], columns),
    ).toEqual([{ offset: 0, length: 8 }]);
  });
});

describe("schedulingConflictsOf", () => {
  const resources: SchedulingBoardResource[] = [
    { id: "pitch", label: "Pitch", capacity: 2 },
    { id: "half", label: "Half", parentId: "pitch" },
  ];

  /** A parent's closure blocks; a booking fills the half; outside hours and the past warn; the moved item is not counted. */
  it("finds the board's own reasons", () => {
    const context = {
      resources,
      items: [
        item("moving", ["half"], at(9), at(10)),
        item("closed", ["pitch"], at(11), at(12), "closure"),
        item("other", ["half"], at(9), at(10)),
      ],
      workingTime: [{ start: at(8), end: at(11, 30) }],
      now: at(9, 30),
    };
    expect(schedulingConflictsOf(draft("half", at(11), at(12)), context)).toEqual([
      { reason: "closure", severity: "block" },
      { reason: "outside_hours", severity: "warn" },
    ]);
    expect(schedulingConflictsOf(draft("half", at(9), at(10)), context)).toEqual([
      { reason: "overlap", severity: "warn" },
      { reason: "in_past", severity: "warn" },
    ]);
    expect(schedulingConflictsOf(draft("pitch", at(10), at(11)), context)).toEqual([]);
  });
});
