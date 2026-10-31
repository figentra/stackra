/**
 * Stackra file contract:
 * Purpose: proves the native Scheduler names events by title and time and calls `onEventPress`, makes empty hours
 *          buttons that call `onSlotPress`, moves with next, and lists the month in the agenda.
 * Boundary: react-native is the DOM stand-in of `#testing/fakes/native-dom`; Text, Heading, Button, IconButton and
 *           SegmentedControl are stand-ins.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { CalendarDate } from "@internationalized/date";
import { createElement, type ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import type { SchedulerEvent } from "#contracts/types/scheduler-event.type";
import { Scheduler } from "#native/scheduler/scheduler";

vi.mock("react-native", async () => (await import("#testing/fakes/native-dom")).nativeDom);
vi.mock("#native/text/text", async () => (await import("#testing/fakes/text-dom")).textDom);
vi.mock("#native/heading/heading", () => ({
  Heading: (props: { children: ReactNode }) => createElement("h2", null, props.children),
}));
vi.mock("#native/button/button", () => ({
  Button: (props: { children: ReactNode; onPress: () => void }) =>
    createElement("button", { type: "button", onClick: props.onPress }, props.children),
}));
vi.mock("#native/icon-button/icon-button", () => ({
  IconButton: (props: { label: string; onPress: () => void }) =>
    createElement("button", { type: "button", onClick: props.onPress, "aria-label": props.label }),
}));
vi.mock("#native/segmented-control/segmented-control", () => ({
  SegmentedControl: () => null,
}));

const at = (date: number, hour: number) => new Date(Date.UTC(2026, 9, date, hour));
const EVENTS: SchedulerEvent[] = [
  { id: "standup", title: "Standup", start: at(28, 9), end: at(28, 10) },
];
const base = {
  label: "Bookings",
  events: EVENTS,
  timeZone: "UTC",
  now: at(28, 12),
  defaultDate: new CalendarDate(2026, 10, 28),
};

describe("Scheduler (native)", () => {
  it("names events and calls back on events and empty hours", () => {
    const onEventPress = vi.fn();
    const onSlotPress = vi.fn();
    render(
      <Scheduler {...base} view="day" onEventPress={onEventPress} onSlotPress={onSlotPress} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /^Standup, 9:00\sAM – 10:00\sAM$/ }));
    expect(onEventPress).toHaveBeenCalledWith(EVENTS[0]);
    fireEvent.click(
      screen.getByRole("button", { name: /^New event, Wednesday, October 28, 2026, 3\sPM$/ }),
    );
    expect(onSlotPress).toHaveBeenCalledWith(at(28, 15));
  });

  it("moves with next and lists the month in the agenda", () => {
    const onDateChange = vi.fn();
    render(<Scheduler {...base} view="agenda" onDateChange={onDateChange} />);
    expect(screen.getByText("Standup")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onDateChange).toHaveBeenCalledWith(new CalendarDate(2026, 11, 28));
    expect(screen.getByText("No events")).toBeTruthy();
  });
});
