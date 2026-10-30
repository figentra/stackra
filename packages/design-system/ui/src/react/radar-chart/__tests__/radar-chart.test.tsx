/**
 * Stackra file contract:
 * Purpose: proves the web RadarChart: drawn at a measured size, it is an image named by its label with one radar per
 *          series, a legend for two series or more, a tooltip for the pointed axis, and its numbers as a table.
 * Boundary: jsdom; the chart's box is given a size through a ResizeObserver stand-in so Recharts draws its SVG.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import { RadarChart } from "#react/radar-chart/radar-chart";

const DATA = [
  { skill: "Speed", a: 80, b: 60 },
  { skill: "Taste", a: 70, b: 90 },
  { skill: "Price", a: 50, b: 40 },
];
const SERIES = [
  { key: "a", label: "Ours" },
  { key: "b", label: "Theirs" },
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

describe("RadarChart (web)", () => {
  it("draws a radar per series with a legend, a table and a tooltip", async () => {
    const { container } = render(
      <RadarChart data={DATA} series={SERIES} xKey="skill" label="Scores" />,
    );
    expect(screen.getByRole("img", { name: "Scores" })).toBeTruthy();
    expect(container.querySelectorAll(".recharts-radar")).toHaveLength(2);
    expect(screen.getByRole("list").textContent).toBe("OursTheirs");
    expect(within(screen.getByRole("table", { name: "Scores" })).getAllByRole("row")).toHaveLength(
      4,
    );
    fireEvent.mouseMove(container.querySelector(".recharts-wrapper") as Element, {
      clientX: 300,
      clientY: 40,
    });
    // Recharts reads the pointer on the next animation frame.
    await act(
      () =>
        new Promise((resolve) => {
          requestAnimationFrame(resolve);
        }),
    );
    expect(container.querySelector(".recharts-tooltip-wrapper")?.textContent).toMatch(
      /Speed|Taste|Price/,
    );
  });

  it("draws one series without a legend or a tooltip", () => {
    const { container } = render(
      <RadarChart
        data={DATA}
        series={SERIES.slice(0, 1)}
        xKey="skill"
        label="Scores"
        showTooltip={false}
      />,
    );
    expect(container.querySelectorAll(".recharts-radar")).toHaveLength(1);
    expect(screen.queryByRole("list")).toBeNull();
    expect(container.querySelector(".recharts-tooltip-wrapper")).toBeNull();
  });
});
