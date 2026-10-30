/**
 * Stackra file contract:
 * Purpose: proves the native RangeCalendar: it opens on the range's month, marks the days of the range, takes two
 *          presses (in either order) as a range with a selection haptic each, marks only the anchor between them,
 *          keeps the range when uncontrolled, and turns off days out of bounds, unavailable or while disabled.
 * Boundary: the house MonthView and haptics are recording stand-ins; what the calendar hands the month is checked.
 * Runtime: node
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0022 (test
 *          placement).
 */
// @vitest-environment jsdom
import { CalendarDate } from "@internationalized/date";
import { act, render } from "@testing-library/react";

import { RangeCalendar } from "#native/range-calendar/range-calendar";

const state = vi.hoisted(() => ({ month: {} as Record<string, unknown>, played: [] as string[] }));

vi.mock("#native/calendar/month-view", () => ({
  MonthView: (props: Record<string, unknown>) => {
    state.month = props;
    return null;
  },
}));
vi.mock("#native/haptics/haptics", () => ({
  haptics: { play: (kind: string) => state.played.push(kind) },
}));

const day = (n: number) => new CalendarDate(2026, 10, n);
const press = (date: CalendarDate) =>
  act(() => (state.month["onPress"] as (next: CalendarDate) => void)(date));
const selected = (date: CalendarDate) =>
  (state.month["isSelected"] as (d: CalendarDate) => boolean)(date);
const off = (date: CalendarDate) => (state.month["isOff"] as (d: CalendarDate) => boolean)(date);

beforeEach(() => {
  state.month = {};
  state.played.length = 0;
});

describe("RangeCalendar (native)", () => {
  it("opens on the range's month and marks its days", () => {
    render(<RangeCalendar defaultValue={{ start: day(3), end: day(5) }} label="Stay" />);
    expect(state.month).toMatchObject({ month: day(3), calendar: "gregory", label: "Stay" });
    expect([2, 3, 4, 5, 6].map((n) => selected(day(n)))).toEqual([false, true, true, true, false]);
  });

  it("takes two presses as a range, backwards too, marking only the anchor between", () => {
    const onChange = vi.fn();
    render(<RangeCalendar onChange={onChange} />);
    expect(selected(day(1))).toBe(false);
    press(day(9));
    expect(onChange).not.toHaveBeenCalled();
    expect([selected(day(9)), selected(day(8))]).toEqual([true, false]);
    press(day(4));
    expect(onChange).toHaveBeenCalledWith({ start: day(4), end: day(9) });
    expect(state.played).toEqual(["selection", "selection"]);
    expect(selected(day(6))).toBe(true);
  });

  it("keeps the owner's range and moves the month on request", () => {
    const onChange = vi.fn();
    render(<RangeCalendar value={{ start: day(1), end: day(2) }} onChange={onChange} />);
    press(day(10));
    press(day(12));
    expect(onChange).toHaveBeenCalledWith({ start: day(10), end: day(12) });
    expect(selected(day(11))).toBe(false);
    act(() => (state.month["onMonthChange"] as (next: CalendarDate) => void)(day(20)));
    expect(state.month["month"]).toEqual(day(20));
  });

  it("turns off days out of bounds or unavailable, and every day while disabled", () => {
    const { rerender } = render(
      <RangeCalendar
        value={null}
        minValue={day(5)}
        maxValue={day(20)}
        isDateUnavailable={(date) => date.day === 10}
      />,
    );
    expect([4, 5, 10, 20, 21].map((n) => off(day(n)))).toEqual([true, false, true, false, true]);
    rerender(<RangeCalendar isDisabled calendar="islamic-umalqura" />);
    expect(off(day(15))).toBe(true);
    expect(state.month["calendar"]).toBe("islamic-umalqura");
  });
});
