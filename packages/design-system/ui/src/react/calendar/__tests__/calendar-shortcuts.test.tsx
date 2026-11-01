/**
 * Stackra file contract:
 * Purpose: proves the web Calendar moves its focused date to today on T while focus is inside it.
 * Boundary: jsdom with real HeroUI and React Aria inside a ShortcutProvider; keys dispatched with their `code`.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement); ADR 0508.
 */
// @vitest-environment jsdom
import { CalendarDate, getLocalTimeZone, today } from "@internationalized/date";
import { ShortcutProvider } from "@stackra/shortcuts/react";
import { act, fireEvent, render, screen } from "@testing-library/react";

import { Calendar } from "#react/calendar/calendar";

describe("Calendar shortcuts (web)", () => {
  it("goes to today on T", () => {
    render(
      <ShortcutProvider>
        <Calendar label="Delivery" defaultValue={new CalendarDate(2020, 1, 15)} />
      </ShortcutProvider>,
    );
    const day = screen.getByRole("button", { name: /15/ });
    act(() => day.focus());
    fireEvent.keyDown(day, { key: "t", code: "KeyT" });
    const now = today(getLocalTimeZone());
    const heading = screen.getByRole("heading");
    expect(heading.textContent).toContain(String(now.year));
  });
});
