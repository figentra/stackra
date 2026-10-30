/**
 * Stackra file contract:
 * Purpose: proves the web DateRangePicker: a group named by its label with a start and an end field, a calendar button
 *          named in English or by `calendarButtonLabel`, presets that pick a range from `today`, mark the picked one
 *          and close, a range chosen on the calendar reported as Gregorian days, controlled open and value, a
 *          read-only picker that never opens, the description and error, and no presets when the list is empty.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so roles and attributes are checked.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { CalendarDate } from "@internationalized/date";
import { act, render, screen, within } from "@testing-library/react";

import { DateRangePicker } from "#react/date-range-picker/date-range-picker";

const TODAY = new CalendarDate(2026, 3, 15);
const press = (element: HTMLElement) => act(() => element.click());
const trigger = (name = /Choose dates/) => screen.getByRole("button", { name });
const presets = () => screen.getByRole("group", { name: "Quick ranges" });

describe("DateRangePicker (web)", () => {
  it("names the group by its label and shows the description", () => {
    render(<DateRangePicker label="Period" description="Report window" today={TODAY} />);
    expect(screen.getByRole("group", { name: "Period" })).toBeTruthy();
    expect(screen.getByText("Report window")).toBeTruthy();
    expect(trigger().getAttribute("aria-haspopup")).toBe("dialog");
  });

  it("opens on the button, picks a preset from today, reports it and closes", () => {
    const onChange = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <DateRangePicker
        label="Period"
        today={TODAY}
        onChange={onChange}
        onOpenChange={onOpenChange}
      />,
    );
    press(trigger());
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    const yesterday = within(presets()).getByRole("button", { name: "Yesterday" });
    expect(yesterday.getAttribute("aria-pressed")).toBe("false");
    press(yesterday);
    expect(onChange).toHaveBeenCalledOnce();
    const range = onChange.mock.calls[0]?.[0];
    expect(range.start.toString()).toBe("2026-03-14");
    expect(range.end.toString()).toBe("2026-03-14");
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("marks the preset that matches the value and keeps a controlled value", () => {
    const onChange = vi.fn();
    render(
      <DateRangePicker
        label="Period"
        today={TODAY}
        value={{ start: TODAY, end: TODAY }}
        onChange={onChange}
        defaultOpen
        presets={["today", "this_month"]}
      />,
    );
    expect(
      within(presets()).getByRole("button", { name: "Today" }).getAttribute("aria-pressed"),
    ).toBe("true");
    press(within(presets()).getByRole("button", { name: "This month" }));
    expect(onChange.mock.calls[0]?.[0].start.toString()).toBe("2026-03-01");
  });

  it("chooses a range on the calendar and reports Gregorian days", () => {
    const onChange = vi.fn();
    render(
      <DateRangePicker
        label="Period"
        calendarButtonLabel="Pick the period"
        today={TODAY}
        defaultValue={{ start: TODAY, end: TODAY }}
        onChange={onChange}
        presets={[]}
      />,
    );
    press(trigger(/Pick the period/));
    expect(screen.queryByRole("group", { name: "Quick ranges" })).toBeNull();
    const grid = screen.getByRole("grid");
    press(within(grid).getByRole("button", { name: /March 2, 2026/ }));
    press(within(grid).getByRole("button", { name: /March 4, 2026/ }));
    const range = onChange.mock.lastCall?.[0];
    expect(range.start).toBeInstanceOf(CalendarDate);
    expect(`${range.start.toString()}..${range.end.toString()}`).toBe("2026-03-02..2026-03-04");
  });

  it("follows isOpen and never opens while read-only", () => {
    const { rerender } = render(<DateRangePicker label="Period" today={TODAY} isOpen />);
    expect(screen.getByRole("dialog")).toBeTruthy();
    rerender(<DateRangePicker label="Period" today={TODAY} isOpen isReadOnly />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows the error message while invalid", () => {
    render(
      <DateRangePicker
        aria-label="Period"
        isInvalid
        errorMessage="Pick both ends"
        isFullWidth={false}
      />,
    );
    expect(screen.getByText("Pick both ends")).toBeTruthy();
  });
});
