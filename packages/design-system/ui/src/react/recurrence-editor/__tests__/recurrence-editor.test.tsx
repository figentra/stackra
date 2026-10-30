/**
 * Stackra file contract:
 * Purpose: proves the web RecurrenceEditor: it starts weekly on the first day's weekday, writes RRULE text as weekdays
 *          are toggled (never emptying the set), offers the monthly day and nth weekday taken from the first day, adds
 *          COUNT when "after" is picked, says the rule in a polite sentence, and writes RSCALE for a Hijri editor.
 * Boundary: jsdom with real HeroUI and React Aria; English words from the catalogue.
 * Runtime: browser
 * Governing contract: RFC 5545; RFC 7529; ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { CalendarDate } from "@internationalized/date";
import { fireEvent, render, screen } from "@testing-library/react";

import { RecurrenceEditor } from "#react/recurrence-editor/recurrence-editor";

/** 2026-10-13, the second Tuesday of October. */
const START = new CalendarDate(2026, 10, 13);

describe("RecurrenceEditor (web)", () => {
  it("starts weekly on the first day's weekday and toggles days into BYDAY", () => {
    const changes: string[] = [];
    render(<RecurrenceEditor startDate={START} onChange={(value) => changes.push(value)} />);
    expect(screen.getByRole("group", { name: "Repeat" })).toBeTruthy();
    const tuesday = screen.getByRole("button", { name: "Tuesday" });
    expect(tuesday.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Thursday" }));
    expect(changes.at(-1)).toBe("FREQ=WEEKLY;BYDAY=TU,TH");
    // The only day left stays picked.
    fireEvent.click(tuesday);
    fireEvent.click(screen.getByRole("button", { name: "Thursday" }));
    expect(changes.at(-1)).toBe("FREQ=WEEKLY;BYDAY=TH");
    expect(document.querySelector('[data-slot="recurrence-summary"]')?.textContent).toContain(
      "Every week on Thursday",
    );
  });

  it("offers the monthly day or the nth weekday and ends after a number of times", () => {
    const changes: string[] = [];
    render(
      <RecurrenceEditor
        startDate={START}
        defaultValue="FREQ=MONTHLY;BYMONTHDAY=13"
        onChange={(value) => changes.push(value)}
      />,
    );
    fireEvent.click(screen.getByRole("radio", { name: "On the second Tuesday" }));
    expect(changes.at(-1)).toBe("FREQ=MONTHLY;BYDAY=2TU");
    fireEvent.click(screen.getByRole("radio", { name: "After a number of times" }));
    expect(changes.at(-1)).toBe("FREQ=MONTHLY;BYDAY=2TU;COUNT=10");
    const summary = document.querySelector('[data-slot="recurrence-summary"]');
    expect(summary?.getAttribute("aria-live")).toBe("polite");
    expect(summary?.textContent).toContain("Every month on the second Tuesday, 10 times");
  });

  it("writes RSCALE and says the Hijri calendar when months count in it", () => {
    render(
      <RecurrenceEditor
        startDate={START}
        calendar="islamic-umalqura"
        value="RSCALE=ISLAMIC-UMALQURA;FREQ=MONTHLY;BYMONTHDAY=1"
      />,
    );
    expect(document.querySelector('[data-slot="recurrence-summary"]')?.textContent).toContain(
      "Every month on day 1, in the Hijri calendar",
    );
  });
});
