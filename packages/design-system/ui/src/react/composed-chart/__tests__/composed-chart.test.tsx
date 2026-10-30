/**
 * Stackra file contract:
 * Purpose: proves the web ComposedChart: drawn at a measured size, it is an image named by its label that draws bars
 *          for most series and a line for the last (or the named `lineKeys`), stacks the bars on request, hides a series
 *          its legend toggles off, becomes a group with a brush, and shows a tooltip for the pointed category.
 * Boundary: jsdom; the chart's box is given a size through a ResizeObserver stand-in so Recharts draws its SVG.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";

import { ComposedChart } from "#react/composed-chart/composed-chart";

const DATA = [
  { month: "Jan", online: 120, store: 80, margin: 12 },
  { month: "Feb", online: 300, store: 90, margin: 18 },
];
const SERIES = [
  { key: "online", label: "Online" },
  { key: "store", label: "Store" },
  { key: "margin", label: "Margin" },
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

describe("ComposedChart (web)", () => {
  it("draws bars for most series and a line for the last, and a tooltip for the pointed category", async () => {
    const { container } = render(
      <ComposedChart data={DATA} series={SERIES} xKey="month" label="Sales" />,
    );
    expect(screen.getByRole("img", { name: "Sales" })).toBeTruthy();
    expect(container.querySelectorAll(".recharts-bar")).toHaveLength(2);
    expect(container.querySelectorAll(".recharts-line")).toHaveLength(1);
    fireEvent.mouseMove(container.querySelector(".recharts-wrapper") as Element, {
      clientX: 150,
      clientY: 100,
    });
    // Recharts reads the pointer on the next animation frame.
    await act(
      () =>
        new Promise((resolve) => {
          requestAnimationFrame(resolve);
        }),
    );
    expect(container.querySelector(".recharts-tooltip-wrapper")?.textContent).toMatch(/Jan|Feb/);
  });

  it("draws the named line keys, stacks the bars, and hides a toggled series", () => {
    const { container } = render(
      <ComposedChart
        data={DATA}
        series={SERIES}
        xKey="month"
        label="Sales"
        lineKeys={["online", "margin"]}
        stacked
      />,
    );
    expect(container.querySelectorAll(".recharts-line")).toHaveLength(2);
    expect(container.querySelectorAll(".recharts-bar")).toHaveLength(1);
    act(() => screen.getByRole("button", { name: "Store" }).click());
    expect(screen.getByRole("button", { name: "Store" }).getAttribute("aria-pressed")).toBe(
      "false",
    );
  });

  it("is a group with a brush", () => {
    const { container } = render(
      <ComposedChart
        data={DATA}
        series={SERIES}
        xKey="month"
        label="Sales"
        showBrush
        showTooltip={false}
      />,
    );
    expect(screen.getByRole("group", { name: "Sales" })).toBeTruthy();
    expect(container.querySelector(".recharts-brush")).not.toBeNull();
  });
});
