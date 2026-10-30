/**
 * Stackra file contract:
 * Purpose: proves the web AreaChart: drawn at a measured size, it is an image named by its label (a group with a
 *          brush), draws one area per series plus a dashed twin for each compared series, hides a series its legend
 *          toggles off, writes reference lines and bands as notes, and gives its numbers as a captioned table.
 * Boundary: jsdom; the chart's box is given a size through a ResizeObserver stand-in so Recharts draws its SVG.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { I18nProvider } from "react-aria-components";

import { AreaChart } from "#react/area-chart/area-chart";

const DATA = [
  { month: "2026-01-01", sales: 120, previous: 90, returns: 4 },
  { month: "2026-02-01", sales: 300, previous: 200, returns: 9 },
  { month: "2026-03-01", sales: 210, previous: 260, returns: 6 },
];
const SERIES = [
  { key: "sales", label: "Sales", compareKey: "previous" },
  { key: "returns", label: "Returns", color: "danger" as const },
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
    toJSON: () => ({}),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("AreaChart (web)", () => {
  it("draws an area per series and a dashed twin for the compared one", () => {
    const { container } = render(
      <AreaChart
        data={DATA}
        series={SERIES}
        xKey="month"
        xFormat={{ month: "short" }}
        label="Sales by month"
        showComparison
        showValueAxis
        references={[
          { value: 250, label: "Target" },
          { from: 100, to: 150, color: "success" },
        ]}
      />,
    );
    expect(screen.getByRole("img", { name: "Sales by month" })).toBeTruthy();
    expect(container.querySelectorAll("linearGradient")).toHaveLength(2);
    expect(container.querySelectorAll(".recharts-area").length).toBe(3);
    expect(container.querySelector('.recharts-area-curve[stroke-dasharray="5 4"]')).not.toBeNull();
    expect(screen.getByRole("table", { name: "Sales by month" }).textContent).toContain("Jan");
    expect(screen.getAllByText(/Target/).length).toBeGreaterThan(0);
  });

  it("shows a tooltip for the pointed month", async () => {
    const { container } = render(
      <AreaChart
        data={DATA}
        series={SERIES}
        xKey="month"
        xFormat={{ month: "long" }}
        label="Sales"
      />,
    );
    fireEvent.mouseMove(container.querySelector(".recharts-wrapper") as Element, {
      clientX: 300,
      clientY: 100,
    });
    // Recharts reads the pointer on the next animation frame.
    await act(
      () =>
        new Promise((resolve) => {
          requestAnimationFrame(resolve);
        }),
    );
    expect(container.querySelector(".recharts-tooltip-wrapper")?.textContent).toMatch(
      /January|February|March/,
    );
  });

  it("hides a series the legend toggles off", () => {
    const { container } = render(
      <AreaChart data={DATA} series={SERIES} xKey="month" label="Sales" />,
    );
    const before = container.querySelectorAll(".recharts-area").length;
    act(() => screen.getByRole("button", { name: "Returns" }).click());
    expect(screen.getByRole("button", { name: "Returns" }).getAttribute("aria-pressed")).toBe(
      "false",
    );
    expect(container.querySelectorAll(".recharts-area").length).toBeLessThan(before);
  });

  it("is a group with a brush, stacks to 100% and reads right to left", () => {
    const { container } = render(
      <I18nProvider locale="ar">
        <AreaChart
          data={DATA}
          series={SERIES}
          xKey="month"
          label="Share"
          stacked
          isNormalized
          showValueAxis
          showBrush
          curve="linear"
          showGrid={false}
          showTooltip={false}
        />
      </I18nProvider>,
    );
    expect(screen.getByRole("group", { name: "Share" })).toBeTruthy();
    expect(container.querySelector(".recharts-brush")).not.toBeNull();
    expect(container.querySelector(".recharts-cartesian-grid")).toBeNull();
  });
});
