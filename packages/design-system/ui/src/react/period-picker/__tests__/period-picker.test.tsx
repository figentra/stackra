/**
 * Stackra file contract:
 * Purpose: proves the web `PeriodPicker`: a group named "Period" with the last 30 days picked by default; a preset
 *          sets its range; "Custom range" shows the date fields; the compare switch adds the previous period, reads it
 *          under the switch, and the mode Select turns it into the same period last year.
 * Boundary: jsdom with real HeroUI and English words; `today` is fixed.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0307 (decision 17); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { CalendarDate } from "@internationalized/date";
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import type { PeriodValue } from "#contracts/types/period-value.type";
import { PeriodPicker } from "#react/period-picker/period-picker";

const TODAY = new CalendarDate(2026, 10, 29);
const press = (element: HTMLElement) => act(() => element.click());
/** Picks `option` from the Select named `name`. */
const choose = (name: RegExp, option: string) => {
  press(screen.getByRole("button", { name }));
  press(within(screen.getByRole("listbox")).getByRole("option", { name: option }));
};

describe("PeriodPicker (web)", () => {
  it("is a named group on the last 30 days by default", () => {
    render(<PeriodPicker today={TODAY} />);
    expect(screen.getByRole("group", { name: "Period" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Range/ }).textContent).toContain("Last 30 days");
  });

  it("hands the whole value on for a preset, and shows the dates for a custom range", () => {
    const onChange = vi.fn<(value: PeriodValue) => void>();
    render(<PeriodPicker today={TODAY} onChange={onChange} />);
    choose(/Range/, "This quarter");
    const value = onChange.mock.lastCall?.[0];
    expect(value?.preset).toBe("this_quarter");
    expect(value?.range.start?.toString()).toBe("2026-10-01");
    expect(value?.range.end?.toString()).toBe("2026-12-31");
    expect(screen.queryByRole("group", { name: "Dates" })).toBeNull();
    choose(/Range/, "Custom range");
    expect(onChange.mock.lastCall?.[0].preset).toBe("custom");
    expect(screen.getByRole("group", { name: "Dates" })).toBeTruthy();
  });

  it("compares with the previous period, then the same period last year", () => {
    const onChange = vi.fn<(value: PeriodValue) => void>();
    render(
      <PeriodPicker
        today={TODAY}
        defaultValue={{
          preset: "last_month",
          range: { start: new CalendarDate(2026, 9, 1), end: new CalendarDate(2026, 9, 30) },
        }}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole("switch", { name: "Compare to previous period" }));
    const compare = onChange.mock.lastCall?.[0].compare;
    expect(compare?.mode).toBe("previous");
    expect(compare?.range.start?.toString()).toBe("2026-08-01");
    expect(compare?.range.end?.toString()).toBe("2026-08-31");
    expect(screen.getByText(/^vs /).textContent).toContain("Aug");
    choose(/Compare with/, "Same period last year");
    expect(onChange.mock.lastCall?.[0].compare?.range.start?.toString()).toBe("2025-09-01");
  });

  it("leaves the comparison out when asked", () => {
    render(<PeriodPicker today={TODAY} showComparison={false} />);
    expect(screen.queryByRole("switch")).toBeNull();
  });
});
