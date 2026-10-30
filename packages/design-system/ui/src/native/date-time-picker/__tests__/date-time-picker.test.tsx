/**
 * Stackra file contract:
 * Purpose: proves the native DateTimePicker: a day picker and a time field named by the catalogue, sharing the
 *          states; it reports a CalendarDateTime only once both a day and a time are set, starts from the given
 *          value, passes the bounds as days, and shows the help and (when invalid) the error.
 * Boundary: React Native does not render in vitest, so it and the house DatePicker, TimeField and Text are recording
 *           stand-ins that render plain DOM.
 * Runtime: node
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0022 (test
 *          placement).
 */
// @vitest-environment jsdom
import { CalendarDate, CalendarDateTime } from "@internationalized/date";
import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { DateTimePicker } from "#native/date-time-picker/date-time-picker";

const state = vi.hoisted(() => ({ props: {} as Record<string, Record<string, unknown>> }));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) =>
      createElement("div", null, props["children"] as ReactNode),
  };
});
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement("span", null, props["children"] as ReactNode),
  };
});
vi.mock("#native/date-picker/date-picker", () => ({
  DatePicker: (props: Record<string, unknown>) => {
    state.props["date"] = props;
    return null;
  },
}));
vi.mock("#native/time-field/time-field", () => ({
  TimeField: (props: Record<string, unknown>) => {
    state.props["time"] = props;
    return null;
  },
}));
vi.mock("#react/hooks/use-ui-text", () => ({ useUiText: () => (key: string) => key }));

const propsOf = (name: string) => state.props[name] ?? {};
const setDay = (day: CalendarDate) =>
  act(() => (propsOf("date")["onChange"] as (next: CalendarDate) => void)(day));
const setTime = (hour: number, minute: number) =>
  act(() => (propsOf("time")["onChange"] as (next: unknown) => void)({ hour, minute }));

beforeEach(() => {
  state.props = {};
});

describe("DateTimePicker (native)", () => {
  it("reports only once both the day and the time are set", () => {
    const onChange = vi.fn();
    render(<DateTimePicker label="When" onChange={onChange} isRequired />);
    expect(screen.getByText("When")).toBeTruthy();
    expect(propsOf("date")).toMatchObject({
      accessibilityLabel: "ui::date_time_picker.date",
      value: null,
      isRequired: true,
    });
    expect(propsOf("time")).toMatchObject({
      accessibilityLabel: "ui::date_time_picker.time",
      value: null,
    });
    setDay(new CalendarDate(2026, 10, 30));
    expect(onChange).not.toHaveBeenCalled();
    setTime(9, 45);
    expect(onChange).toHaveBeenCalledWith(new CalendarDateTime(2026, 10, 30, 9, 45));
    setDay(new CalendarDate(2026, 11, 1));
    expect(onChange).toHaveBeenLastCalledWith(new CalendarDateTime(2026, 11, 1, 9, 45));
  });

  it("starts from defaultValue and passes the calendar, bounds and hour cycle", () => {
    const min = new CalendarDateTime(2026, 1, 1, 8, 0);
    render(
      <DateTimePicker
        defaultValue={new CalendarDateTime(2026, 5, 6, 7, 8)}
        minValue={min}
        maxValue={min}
        hourCycle={24}
        calendarButtonLabel="Cal"
        description="Local time"
      />,
    );
    expect(propsOf("date")).toMatchObject({
      value: new CalendarDate(2026, 5, 6),
      minValue: new CalendarDate(2026, 1, 1),
      maxValue: new CalendarDate(2026, 1, 1),
      calendarButtonLabel: "Cal",
    });
    expect(propsOf("time")).toMatchObject({ value: { hour: 7, minute: 8 }, hourCycle: 24 });
    expect(screen.getByText("Local time")).toBeTruthy();
  });

  it("shows the owner's value and the error only when invalid", () => {
    const { rerender } = render(
      <DateTimePicker
        value={new CalendarDateTime(2026, 2, 3, 4, 5)}
        errorMessage="Bad"
        isDisabled
      />,
    );
    expect(propsOf("date")).toMatchObject({
      value: new CalendarDate(2026, 2, 3),
      isDisabled: true,
    });
    expect(propsOf("time")["value"]).toEqual({ hour: 4, minute: 5 });
    expect(screen.queryByText("Bad")).toBeNull();
    rerender(<DateTimePicker errorMessage="Bad" isInvalid className="x" />);
    expect(screen.getByText("Bad")).toBeTruthy();
  });
});
