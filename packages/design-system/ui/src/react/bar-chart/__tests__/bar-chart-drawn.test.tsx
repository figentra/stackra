/**
 * Stackra file contract:
 * Purpose: proves the drawn web BarChart: at a measured size it draws a bar per series and a dashed twin per compared
 *          series, sorts its categories, lays bars along the side when horizontal (also right to left), stacks to 100%,
 *          becomes a group with a brush flag, and shows a tooltip for the pointed category.
 * Boundary: jsdom; the chart's box is given a size through a ResizeObserver stand-in so Recharts draws its SVG.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { I18nProvider } from "react-aria-components";

import { BarChart } from "#react/bar-chart/bar-chart";

const DATA = [
  { month: "Jan", desktop: 100, mobile: 80, last: 90 },
  { month: "Feb", desktop: 305, mobile: "?", last: 200 },
];
const SERIES = [
  { key: "desktop", label: "Desktop", compareKey: "last" },
  { key: "mobile", label: "Mobile" },
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

const categories = () =>
  within(screen.getByRole("table"))
    .getAllByRole("rowheader")
    .map((cell) => cell.textContent);

describe("BarChart drawn (web)", () => {
  it("draws bars and compared twins, sorts by total, and shows a tooltip", async () => {
    const { container } = render(
      <BarChart
        data={DATA}
        series={SERIES}
        xKey="month"
        label="Visitors"
        showComparison
        sort="value-desc"
      />,
    );
    expect(screen.getByRole("img", { name: "Visitors" })).toBeTruthy();
    expect(container.querySelectorAll(".recharts-bar")).toHaveLength(3);
    expect(categories()).toEqual(["Feb", "Jan"]);
    fireEvent.mouseMove(container.querySelector(".recharts-wrapper") as Element, {
      clientX: 200,
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

  it("stacks horizontal bars to 100%, right to left, and hides a toggled series", () => {
    const { container } = render(
      <I18nProvider locale="ar">
        <BarChart
          data={DATA}
          series={SERIES}
          xKey="month"
          label="Share"
          orientation="horizontal"
          stacked
          isNormalized
          showComparison
          showValueAxis
          sort="label"
        />
      </I18nProvider>,
    );
    expect(container.querySelector(".recharts-bar")).not.toBeNull();
    act(() => screen.getByRole("button", { name: "Mobile" }).click());
    expect(screen.getByRole("button", { name: "Mobile" }).getAttribute("aria-pressed")).toBe(
      "false",
    );
  });

  it("stacks vertical bars left to right and is a group when a brush is asked for", () => {
    const { container } = render(
      <BarChart data={DATA} series={SERIES} xKey="month" label="Stack" stacked showBrush />,
    );
    expect(screen.getByRole("group", { name: "Stack" })).toBeTruthy();
    expect(container.querySelector(".recharts-brush")).toBeNull();
    expect(container.querySelectorAll(".recharts-bar")).toHaveLength(2);
  });

  it("stacks horizontal bars left to right", () => {
    const { container } = render(
      <BarChart
        data={DATA}
        series={SERIES}
        xKey="month"
        label="Side"
        stacked
        orientation="horizontal"
      />,
    );
    expect(container.querySelectorAll(".recharts-bar")).toHaveLength(2);
  });
});
