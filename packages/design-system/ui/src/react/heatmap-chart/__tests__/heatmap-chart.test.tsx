/**
 * Stackra file contract:
 * Purpose: proves the web HeatmapChart's pointing and legend: a pointed cell writes its row, column and value (a dash
 *          for an empty cell) and is outlined, leaving the grid clears it, and the scale legend can be turned off.
 * Boundary: jsdom; pointer events are fired on the cells, which are presentational spans.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { HeatmapChart } from "#react/heatmap-chart/heatmap-chart";

const DATA = [
  { day: "Mon", hour: "09", n: 3 },
  { day: "Mon", hour: "10", n: 1200 },
  { day: "Tue", hour: "09", n: 0 },
];

describe("HeatmapChart pointing (web)", () => {
  it("reads the pointed cell, outlines it, and clears on leave", () => {
    render(
      <HeatmapChart
        data={DATA}
        xKey="hour"
        yKey="day"
        valueKey="n"
        label="Orders"
        valueFormat={{}}
      />,
    );
    const image = screen.getByRole("img", { name: "Orders" });
    const readout = image.querySelector("p") as HTMLElement;
    const grid = readout.nextElementSibling as HTMLElement;
    const cells = [...grid.querySelectorAll<HTMLElement>("span[style]")];
    expect(cells).toHaveLength(4);
    fireEvent.pointerEnter(cells[1] as Element);
    expect(readout.textContent).toBe("Mon, 10: 1,200");
    expect(cells[1]?.className).toContain("outline-2");
    fireEvent.pointerEnter(cells[3] as Element);
    expect(readout.textContent).toBe("Tue, 10: –");
    fireEvent.pointerLeave(grid);
    expect(readout.textContent).toBe("");
  });

  it("draws the scale legend by default and leaves it out when asked", () => {
    const { container, rerender } = render(
      <HeatmapChart data={DATA} xKey="hour" yKey="day" valueKey="n" label="Orders" />,
    );
    const withLegend = container.textContent;
    rerender(
      <HeatmapChart
        data={DATA}
        xKey="hour"
        yKey="day"
        valueKey="n"
        label="Orders"
        showLegend={false}
        color="success"
      />,
    );
    expect(withLegend).toContain("Less");
    expect(container.textContent).not.toContain("Less");
  });
});
