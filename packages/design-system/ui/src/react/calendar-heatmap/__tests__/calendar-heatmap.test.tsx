/**
 * Stackra file contract:
 * Purpose: proves the web CalendarHeatmap's pointing and range: a pointed day writes its date and value (a dash for a
 *          day without one) and is outlined, a day outside the range is hidden and reads nothing, leaving clears it,
 *          the month is written over the week holding its first, and no values and no range draw an empty calendar.
 * Boundary: jsdom; pointer events are fired on the day cells, which are presentational spans.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { CalendarHeatmap } from "#react/calendar-heatmap/calendar-heatmap";

describe("CalendarHeatmap pointing (web)", () => {
  it("reads the pointed day, hides days outside the range, and clears on leave", () => {
    render(
      <CalendarHeatmap
        values={[
          { date: "2026-09-29", value: 4 },
          { date: "2026-10-01T08:00:00Z", value: 9 },
        ]}
        end="2026-10-05"
        weekStart={1}
        label="Activity"
      />,
    );
    const image = screen.getByRole("img", { name: "Activity" });
    const readout = image.querySelector("p") as HTMLElement;
    const cells = [...image.querySelectorAll<HTMLElement>("span.size-3")];
    const hidden = cells.filter((cell) => cell.className.includes("invisible"));
    expect(hidden.length).toBeGreaterThan(0);
    const shown = cells.filter((cell) => !cell.className.includes("invisible"));
    fireEvent.pointerEnter(shown[0] as Element);
    expect(readout.textContent).toMatch(/Sep.*: 4$/);
    expect(shown[0]?.className).toContain("outline-2");
    fireEvent.pointerEnter(shown[1] as Element);
    expect(readout.textContent).toMatch(/: –$/);
    fireEvent.pointerEnter(hidden[0] as Element);
    expect(readout.textContent).toBe("");
    fireEvent.pointerEnter(shown[0] as Element);
    fireEvent.pointerLeave(readout.nextElementSibling as HTMLElement);
    expect(readout.textContent).toBe("");
    expect(image.textContent).toContain("Oct");
  });

  it("draws an empty calendar with no values and no range, without the legend when asked", () => {
    render(<CalendarHeatmap values={[]} label="Nothing" showLegend={false} color="success" />);
    const image = screen.getByRole("img", { name: "Nothing" });
    expect(image.textContent).not.toContain("Less");
    expect(
      screen.getByRole("table", { name: "Nothing" }).querySelectorAll("tbody tr"),
    ).toHaveLength(0);
  });
});
