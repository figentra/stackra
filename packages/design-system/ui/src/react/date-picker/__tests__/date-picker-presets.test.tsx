/**
 * Stackra file contract:
 * Purpose: proves the web DatePicker's presets sit in a named group inside the open popover and a press sets the day
 *          (Gregorian) and closes the popover.
 * Boundary: jsdom with the real HeroUI and React Aria components; English words from the catalogue.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { CalendarDate } from "@internationalized/date";
import { fireEvent, render, screen } from "@testing-library/react";

import { DatePreset } from "#contracts/enums/date-preset.enum";
import { DatePicker } from "#react/date-picker/date-picker";

describe("DatePicker presets (web)", () => {
  it("sets the day from a preset and closes", () => {
    const days: string[] = [];
    const open: boolean[] = [];
    render(
      <DatePicker
        label="Due date"
        presets={DatePreset}
        today={new CalendarDate(2026, 10, 29)}
        defaultOpen
        onOpenChange={(next) => open.push(next)}
        onChange={(day) => days.push(String(day))}
      />,
    );
    expect(screen.getByRole("group", { name: "Quick dates" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Tomorrow" }));
    expect(days).toEqual(["2026-10-30"]);
    expect(open.at(-1)).toBe(false);
  });
});
