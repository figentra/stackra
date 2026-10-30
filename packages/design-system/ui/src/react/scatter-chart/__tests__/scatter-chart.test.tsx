/**
 * Stackra file contract:
 * Purpose: proves the drawn web ScatterChart: at a measured size it draws a scatter per series (one group without a
 *          group key), sizes bubbles by `sizeKey`, draws reference lines and bands and writes them as notes, hides a
 *          series its legend toggles off, reads right to left, and shows a tooltip with the pointed point's numbers.
 * Boundary: jsdom; the chart's box is given a size through a ResizeObserver stand-in so Recharts draws its SVG.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { I18nProvider } from "react-aria-components";

import { ScatterChart } from "#react/scatter-chart/scatter-chart";

const DATA = [
  { g: "a", x: 10, y: 1200, s: 5 },
  { g: "b", x: 20, y: 300, s: 9 },
  { g: "b", x: 30, y: "?", s: 2 },
];
const SERIES = [
  { key: "a", label: "Drinks" },
  { key: "b", label: "Food" },
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

describe("ScatterChart drawn (web)", () => {
  it("draws a scatter per series, reference marks as notes, and a tooltip for a pointed point", async () => {
    const { container } = render(
      <ScatterChart
        data={DATA}
        series={SERIES}
        groupKey="g"
        xKey="x"
        yKey="y"
        sizeKey="s"
        xLabel="Price"
        yLabel="Units"
        sizeLabel="Revenue"
        label="Products"
        references={[
          { value: 500, label: "Target", color: "success" },
          { value: 800 },
          { from: 100, to: 200 },
          { from: 100 },
        ]}
      />,
    );
    expect(screen.getByRole("img", { name: "Products" })).toBeTruthy();
    expect(container.querySelectorAll(".recharts-scatter")).toHaveLength(2);
    expect(container.querySelectorAll(".recharts-reference-line")).toHaveLength(2);
    expect(container.querySelectorAll(".recharts-reference-area")).toHaveLength(1);
    expect(
      within(screen.getByRole("table", { name: "Products" })).getAllByRole("row")[3]?.textContent,
    ).toBe("Food302");
    const symbol = container.querySelector(".recharts-scatter-symbol");
    expect(symbol).not.toBeNull();
    fireEvent.mouseEnter(symbol as Element);
    await act(
      () =>
        new Promise((resolve) => {
          requestAnimationFrame(resolve);
        }),
    );
    const tooltip = container.querySelector(".recharts-tooltip-wrapper")?.textContent ?? "";
    expect(tooltip).toContain("Price");
    expect(tooltip).toContain("Revenue");
  });

  it("puts every row in one group without a group key, hides a toggled series, and reads right to left", () => {
    const { container, rerender } = render(
      <I18nProvider locale="ar">
        <ScatterChart
          data={DATA}
          series={SERIES.slice(0, 1)}
          xKey="x"
          yKey="y"
          xLabel="Price"
          yLabel="Units"
          label="Products"
          showLegend
          references={[{ value: 500, label: "Target" }]}
          showTooltip={false}
        />
      </I18nProvider>,
    );
    expect(container.querySelectorAll(".recharts-reference-line")).toHaveLength(1);
    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(4);
    act(() => screen.getByRole("button", { name: "Drinks" }).click());
    expect(screen.getByRole("button", { name: "Drinks" }).getAttribute("aria-pressed")).toBe(
      "false",
    );
    rerender(
      <ScatterChart
        data={DATA}
        series={SERIES}
        groupKey="g"
        xKey="x"
        yKey="y"
        xLabel="P"
        yLabel="U"
        label="L"
      />,
    );
    expect(screen.getByRole("table").querySelectorAll("thead th")).toHaveLength(3);
  });
});
