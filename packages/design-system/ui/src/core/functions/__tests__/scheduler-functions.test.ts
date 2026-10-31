/**
 * Stackra file contract:
 * Purpose: proves the Scheduler's layout: `schedulerDaysOf` holds the day, the locale's week or the month;
 *          `eventsOnDayOf` keeps the events touching a day, all-day first; `dayLayoutOf` places timed events by the
 *          hours shown, cuts them at the edges and gives overlapping events their own lanes.
 * Boundary: pure functions; UTC, so no daylight-saving shift.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); STA-1371.
 */
import { CalendarDate } from "@internationalized/date";

import type { SchedulerEvent } from "#contracts/types/scheduler-event.type";
import { dayLayoutOf } from "#core/functions/day-layout-of.function";
import { eventsOnDayOf } from "#core/functions/events-on-day-of.function";
import { schedulerDaysOf } from "#core/functions/scheduler-days-of.function";

const day = new CalendarDate(2026, 10, 28);
const at = (hour: number, minute = 0, date = 28) => new Date(Date.UTC(2026, 9, date, hour, minute));
const event = (id: string, start: Date, end: Date, isAllDay = false): SchedulerEvent => ({
  id,
  title: id,
  start,
  end,
  isAllDay,
});
const hours = { timeZone: "UTC", startHour: 8, endHour: 18 };

describe("schedulerDaysOf", () => {
  it("holds the day, the locale's week and the month", () => {
    expect(schedulerDaysOf("day", day, "en-US").map(String)).toEqual(["2026-10-28"]);
    expect(schedulerDaysOf("week", day, "en-US")[0]?.toString()).toBe("2026-10-25");
    expect(schedulerDaysOf("week", day, "fr-FR")[0]?.toString()).toBe("2026-10-26");
    const month = schedulerDaysOf("agenda", day, "en-US");
    expect([month.length, month[0]?.toString(), month.at(-1)?.toString()]).toEqual([
      31,
      "2026-10-01",
      "2026-10-31",
    ]);
  });
});

describe("eventsOnDayOf", () => {
  it("keeps the events touching the day, all-day first, then by start", () => {
    const events = [
      event("late", at(15), at(16)),
      event("early", at(9), at(10)),
      event("holiday", at(0), at(0, 0, 29), true),
      event("overnight", at(22, 0, 27), at(1)),
      event("tomorrow", at(0, 0, 29), at(1, 0, 29)),
    ];
    expect(eventsOnDayOf(events, day, "UTC").map((e) => e.id)).toEqual([
      "holiday",
      "overnight",
      "early",
      "late",
    ]);
  });
});

describe("dayLayoutOf", () => {
  it("places an event by the hours shown and cuts it at their edges", () => {
    const [early, nine] = dayLayoutOf(
      [event("nine", at(9), at(10, 30)), event("early", at(6), at(9))],
      day,
      hours,
    );
    expect(early).toMatchObject({ top: 0, height: 0.1, lane: 0, lanes: 1 });
    expect(nine).toMatchObject({ top: 0.1, height: 0.15, lane: 0, lanes: 1 });
  });

  it("gives overlapping events their own lanes and reuses a lane once it is free", () => {
    const placed = dayLayoutOf(
      [
        event("a", at(9), at(11)),
        event("b", at(9, 30), at(10)),
        event("c", at(10), at(10, 30)),
        event("d", at(12), at(13)),
        event("all-day", at(0), at(0, 0, 29), true),
      ],
      day,
      hours,
    );
    expect(placed.map((p) => [p.event.id, p.lane, p.lanes])).toEqual([
      ["a", 0, 2],
      ["b", 1, 2],
      ["c", 1, 2],
      ["d", 0, 1],
    ]);
  });

  it("leaves out events outside the hours", () => {
    expect(dayLayoutOf([event("night", at(20), at(21))], day, hours)).toEqual([]);
  });
});
