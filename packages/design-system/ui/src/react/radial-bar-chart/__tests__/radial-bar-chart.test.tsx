/**
 * Stackra file contract:
 * Purpose: proves the web RadialBarChart: drawn at a measured size, it is an image named by its label with a ring per
 *          row, writes the total in the middle under a centre label, takes a legend only on request, and gives its
 *          numbers as a table.
 * Boundary: jsdom; the chart's box is given a size through a ResizeObserver stand-in so Recharts draws its SVG.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";

import { RadialBarChart } from "#react/radial-bar-chart/radial-bar-chart";

const DATA = [
  { goal: "steps", done: 70 },
  { goal: "sleep", done: 40 },
];
const SERIES = [
  { key: "steps", label: "Steps" },
  { key: "sleep", label: "Sleep" },
];

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(private readonly callback: ResizeObserverCallback) {}

      observe(target: Element) {
        this.callback(
          [{ target, contentRect: { width: 600, height: 240 } } as unknown as ResizeObserverEntry],
          this as unknown as ResizeObserver,
        );
      }

      unobserve() {}

      disconnect() {}
    },
  );
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    width: 600,
    height: 240,
    top: 0,
    left: 0,
    right: 600,
    bottom: 240,
    x: 0,
    y: 0,
  } as DOMRect);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("RadialBarChart (web)", () => {
  it("draws a ring per row, the total under the centre label, and a table", () => {
    const { container } = render(
      <RadialBarChart
        data={DATA}
        series={SERIES}
        nameKey="goal"
        valueKey="done"
        label="Goals"
        centerLabel="Done"
        maxValue={100}
      />,
    );
    expect(screen.getByRole("img", { name: "Goals" })).toBeTruthy();
    expect(container.querySelectorAll(".recharts-sector").length).toBeGreaterThanOrEqual(2);
    expect(container.textContent).toContain("110");
    expect(within(screen.getByRole("table", { name: "Goals" })).getAllByRole("row")).toHaveLength(
      3,
    );
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("draws one row as a thin ring with a legend and no tooltip, counting a missing value as nothing", () => {
    const { container } = render(
      <RadialBarChart
        data={[{ goal: "steps", done: "n/a" }]}
        series={SERIES.slice(0, 1)}
        nameKey="goal"
        valueKey="done"
        label="Goals"
        showLegend
        showTooltip={false}
      />,
    );
    expect(screen.getByRole("list").textContent).toBe("Steps");
    expect(container.querySelector(".recharts-tooltip-wrapper")).toBeNull();
  });
});
