/**
 * Stackra file contract:
 * Purpose: proves the native Calendar draws the chosen day's month with each day named by its full date, selects the
 *          chosen day, hands out the picked day and refuses days outside its bounds.
 * Boundary: react-native is the DOM stand-in of `#testing/fakes/native-dom`; the provider, haptics, Text and
 *           IconButton are stand-ins.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { CalendarDate } from "@internationalized/date";
import { fireEvent, render, screen } from "@testing-library/react";

import { Calendar } from "#native/calendar/calendar";

vi.mock("react-native", async () => (await import("#testing/fakes/native-dom")).nativeDom);
vi.mock("#native/text/text", async () => (await import("#testing/fakes/text-dom")).textDom);
vi.mock("#native/design-system-provider/use-design-system", () => ({
  useDesignSystem: () => ({ locale: "en-US" }),
}));
vi.mock("#native/haptics/haptics", () => ({ haptics: { play: () => undefined } }));
vi.mock("#native/icon-button/icon-button", () => ({ IconButton: () => null }));

describe("Calendar (native)", () => {
  it("selects the chosen day and hands out the day pressed", () => {
    const days: string[] = [];
    render(
      <Calendar
        defaultValue={new CalendarDate(2026, 11, 3)}
        onChange={(day) => days.push(day.toString())}
      />,
    );
    expect(
      screen.getByRole("button", { name: /November 3, 2026/ }).getAttribute("aria-selected"),
    ).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: /November 12, 2026/ }));
    expect(days).toEqual(["2026-11-12"]);
  });

  it("refuses days after `maxValue`", () => {
    render(
      <Calendar
        defaultValue={new CalendarDate(2026, 11, 3)}
        maxValue={new CalendarDate(2026, 11, 10)}
      />,
    );
    expect(
      screen.getByRole("button", { name: /November 20, 2026/ }).getAttribute("aria-disabled"),
    ).toBe("true");
  });
});
