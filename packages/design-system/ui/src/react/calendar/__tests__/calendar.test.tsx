/**
 * Stackra file contract:
 * Purpose: proves the web Calendar is a named grid that shows the chosen day's month, hands out the picked day, and
 *          refuses days outside its bounds.
 * Boundary: jsdom with the real HeroUI and React Aria components.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { CalendarDate } from "@internationalized/date";
import { fireEvent, render, screen } from "@testing-library/react";

import { Calendar } from "#react/calendar/calendar";

describe("Calendar (web)", () => {
  it("is a named grid that hands out the day picked", () => {
    const days: string[] = [];
    render(
      <Calendar
        label="Delivery day"
        defaultValue={new CalendarDate(2026, 11, 3)}
        onChange={(day) => days.push(day.toString())}
      />,
    );
    expect(screen.getByRole("application", { name: /Delivery day/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /November 12, 2026/ }));
    expect(days).toEqual(["2026-11-12"]);
  });

  it("refuses days after `maxValue`", () => {
    render(
      <Calendar
        label="Delivery day"
        defaultValue={new CalendarDate(2026, 11, 3)}
        maxValue={new CalendarDate(2026, 11, 10)}
      />,
    );
    const late = screen.getByRole("button", { name: /November 20, 2026/ });
    expect(late.getAttribute("aria-disabled")).toBe("true");
  });
});
