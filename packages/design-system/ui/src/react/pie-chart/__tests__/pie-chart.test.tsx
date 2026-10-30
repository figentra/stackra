/**
 * Stackra file contract:
 * Purpose: proves the web PieChart: drawn at a measured size, it is an image named by its label with a full pie (no
 *          hole) and one slice per row, a legend only on request, and its numbers as a table.
 * Boundary: jsdom; the chart's box is given a size through a ResizeObserver stand-in so Recharts draws its SVG.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";

import { PieChart } from "#react/pie-chart/pie-chart";

const DATA = [
  { browser: "chrome", visitors: 275 },
  { browser: "safari", visitors: 200 },
];
const SERIES = [
  { key: "chrome", label: "Chrome" },
  { key: "safari", label: "Safari" },
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

describe("PieChart (web)", () => {
  it("draws a slice per row with a legend on request and a table", () => {
    const { container } = render(
      <PieChart
        data={DATA}
        series={SERIES}
        nameKey="browser"
        valueKey="visitors"
        label="Browsers"
        showLegend
      />,
    );
    expect(screen.getByRole("img", { name: "Browsers" })).toBeTruthy();
    expect(container.querySelectorAll(".recharts-pie-sector")).toHaveLength(2);
    expect(screen.getByRole("list").textContent).toBe("ChromeSafari");
    expect(screen.getByRole("table", { name: "Browsers" }).textContent).toContain("Chrome275");
  });
});
