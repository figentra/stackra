/**
 * Stackra file contract:
 * Purpose: proves the web Scheduler: the week view names each event by title and time and calls `onEventPress`; an
 *          empty hour calls `onSlotPress` with its start; next moves a week; a date opens its day; the month view shows
 *          "N more"; the agenda says when the month is empty.
 * Boundary: jsdom with the real HeroUI and React Aria components; UTC and a fixed now.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { CalendarDate } from "@internationalized/date";
import { fireEvent, render, screen } from "@testing-library/react";

import type { SchedulerEvent } from "#contracts/types/scheduler-event.type";
import { Scheduler } from "#react/scheduler/scheduler";

const at = (date: number, hour: number, minute = 0) =>
  new Date(Date.UTC(2026, 9, date, hour, minute));
const EVENTS: SchedulerEvent[] = [
  { id: "standup", title: "Standup", start: at(28, 9), end: at(28, 9, 30) },
  { id: "review", title: "Review", start: at(28, 9), end: at(28, 10), tone: "warning" },
  { id: "a", title: "A", start: at(29, 11), end: at(29, 12) },
  { id: "b", title: "B", start: at(29, 13), end: at(29, 14) },
  { id: "c", title: "C", start: at(29, 15), end: at(29, 16) },
];
const base = {
  label: "Bookings",
  events: EVENTS,
  timeZone: "UTC",
  now: at(28, 12),
  defaultDate: new CalendarDate(2026, 10, 28),
};

describe("Scheduler (web)", () => {
  it("names events by title and time and calls back on events and empty hours", () => {
    const onEventPress = vi.fn();
    const onSlotPress = vi.fn();
    render(<Scheduler {...base} onEventPress={onEventPress} onSlotPress={onSlotPress} />);
    expect(screen.getByRole("region", { name: "Bookings" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /^Standup, 9:00\sAM – 9:30\sAM$/ }));
    expect(onEventPress).toHaveBeenCalledWith(EVENTS[0]);
    fireEvent.click(
      screen.getAllByRole("button", {
        name: /^New event, Wednesday, October 28, 2026, 2\sPM$/,
      })[0] as HTMLElement,
    );
    expect(onSlotPress).toHaveBeenCalledWith(at(28, 14));
    expect(screen.getByRole("img", { name: "Now" })).toBeTruthy();
  });

  it("moves a week with next and opens a day from its date", () => {
    const onDateChange = vi.fn();
    const onViewChange = vi.fn();
    render(<Scheduler {...base} onDateChange={onDateChange} onViewChange={onViewChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onDateChange).toHaveBeenLastCalledWith(new CalendarDate(2026, 11, 4));
    fireEvent.click(screen.getByRole("button", { name: "Wednesday, November 4, 2026" }));
    expect(onViewChange).toHaveBeenLastCalledWith("day");
    expect(screen.getByRole("heading", { name: "Wednesday, November 4, 2026" })).toBeTruthy();
  });

  it("shows N more in the month and an empty agenda", () => {
    const { rerender } = render(<Scheduler {...base} view="month" />);
    expect(screen.getByRole("columnheader", { name: "Sun" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "1 more" })).toBeTruthy();
    rerender(<Scheduler {...base} view="agenda" date={new CalendarDate(2026, 12, 1)} />);
    expect(screen.getByText("No events")).toBeTruthy();
  });
});
