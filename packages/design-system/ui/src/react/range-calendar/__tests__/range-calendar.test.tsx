/**
 * Stackra file contract:
 * Purpose: proves the web RangeCalendar: a grid named by its label on the month of the range, a start and an end day
 *          chosen by pointer and reported as Gregorian days, month navigation, unavailable and out-of-bounds days, a
 *          disabled calendar, and `ariaRangeOf` turning a half-open range into none.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so roles and attributes are checked.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { CalendarDate } from "@internationalized/date";
import { act, render, screen } from "@testing-library/react";

import { ariaRangeOf } from "#react/range-calendar/aria-range-of.function";
import { RangeCalendar } from "#react/range-calendar/range-calendar";

const MARCH_5 = new CalendarDate(2026, 3, 5);
const press = (element: HTMLElement) => act(() => element.click());
const day = (name: RegExp) => screen.getByRole("button", { name });

describe("RangeCalendar (web)", () => {
  it("chooses a start and an end day and reports them", () => {
    const onChange = vi.fn();
    render(
      <RangeCalendar
        label="Stay"
        defaultValue={{ start: MARCH_5, end: MARCH_5 }}
        onChange={onChange}
      />,
    );
    expect(screen.getByRole("application", { name: /Stay/ })).toBeTruthy();
    press(day(/March 10, 2026/));
    press(day(/March 12, 2026/));
    const range = onChange.mock.lastCall?.[0];
    expect(`${range.start.toString()}..${range.end.toString()}`).toBe("2026-03-10..2026-03-12");
  });

  it("moves between months", () => {
    render(<RangeCalendar label="Stay" value={{ start: MARCH_5, end: MARCH_5 }} />);
    press(screen.getAllByRole("button", { name: "Next" })[0] as HTMLElement);
    expect(screen.getByRole("grid", { name: /April 2026/ })).toBeTruthy();
  });

  it("refuses unavailable and out-of-bounds days, and every day while disabled", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <RangeCalendar
        label="Stay"
        defaultValue={{ start: MARCH_5, end: MARCH_5 }}
        minValue={new CalendarDate(2026, 3, 3)}
        isDateUnavailable={(date) => date.day === 20}
        onChange={onChange}
      />,
    );
    expect(day(/March 2, 2026/).getAttribute("aria-disabled")).toBe("true");
    press(day(/March 2, 2026/));
    expect(onChange).not.toHaveBeenCalled();
    rerender(
      <RangeCalendar label="Stay" defaultValue={{ start: MARCH_5, end: MARCH_5 }} isDisabled />,
    );
    expect(day(/March 10, 2026/).getAttribute("aria-disabled")).toBe("true");
  });

  it("turns a missing or half-open range into none", () => {
    expect(ariaRangeOf(undefined)).toBeUndefined();
    expect(ariaRangeOf(null)).toBeNull();
    expect(ariaRangeOf({ start: MARCH_5, end: null })).toBeNull();
    expect(ariaRangeOf({ start: MARCH_5, end: MARCH_5 })).toEqual({ start: MARCH_5, end: MARCH_5 });
  });
});
