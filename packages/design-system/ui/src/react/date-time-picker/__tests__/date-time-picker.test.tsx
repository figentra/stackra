/**
 * Stackra file contract:
 * Purpose: proves the web DateTimePicker: a group named by its label with date and minute segments, a calendar button
 *          named in English or by `calendarButtonLabel`, a day chosen on the calendar reported with its time, a time
 *          stepped from the keyboard, the description and error, and a read-only picker that never opens.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so roles and attributes are checked.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { CalendarDateTime } from "@internationalized/date";
import { act, fireEvent, render, screen } from "@testing-library/react";

import { DateTimePicker } from "#react/date-time-picker/date-time-picker";

const AT = new CalendarDateTime(2026, 3, 5, 9, 30);
const press = (element: HTMLElement) => act(() => element.click());
const segment = (kind: string) =>
  [...document.querySelectorAll<HTMLElement>('[role="spinbutton"]')].find(
    (candidate) => candidate.dataset["type"] === kind,
  ) as HTMLElement;

describe("DateTimePicker (web)", () => {
  it("names the group, shows date and minute segments and the description", () => {
    render(<DateTimePicker label="Starts" description="Local" defaultValue={AT} />);
    expect(screen.getByRole("group", { name: "Starts" })).toBeTruthy();
    expect(screen.getByText("Local")).toBeTruthy();
    expect(segment("minute").textContent).toBe("30");
    expect(screen.getByRole("button", { name: /Choose a date/ })).toBeTruthy();
  });

  it("chooses a day on the calendar and keeps the time", () => {
    const onChange = vi.fn();
    render(
      <DateTimePicker
        label="Starts"
        calendarButtonLabel="Pick the start"
        defaultValue={AT}
        onChange={onChange}
      />,
    );
    press(screen.getByRole("button", { name: /Pick the start/ }));
    press(screen.getByRole("button", { name: /March 6, 2026/ }));
    const next = onChange.mock.lastCall?.[0] as CalendarDateTime;
    expect(next.toString()).toBe("2026-03-06T09:30:00");
  });

  it("steps the minute from the keyboard", () => {
    const onChange = vi.fn();
    render(<DateTimePicker label="Starts" value={AT} onChange={onChange} />);
    act(() => segment("minute").focus());
    fireEvent.keyDown(segment("minute"), { key: "ArrowUp" });
    expect(onChange.mock.lastCall?.[0]?.minute).toBe(31);
  });

  it("never opens while read-only and shows the error while invalid", () => {
    render(
      <DateTimePicker
        aria-label="Starts"
        defaultValue={AT}
        isReadOnly
        defaultOpen
        isInvalid
        errorMessage="Too late"
        isFullWidth={false}
        className="x-dt"
      />,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByText("Too late")).toBeTruthy();
  });
});
