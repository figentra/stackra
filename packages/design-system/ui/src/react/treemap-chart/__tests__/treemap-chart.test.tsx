/**
 * Stackra file contract:
 * Purpose: proves the web TreemapChart: an image named by its label with one tile per item, each tile written with its
 *          label and value in the locale and placed from the inline start, sorted on request, re-laid out when its box
 *          is measured, and its numbers given as a captioned table.
 * Boundary: jsdom; a ResizeObserver stand-in reports the box's width, since jsdom lays nothing out.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { I18nProvider } from "react-aria-components";

import { TreemapChart } from "#react/treemap-chart/treemap-chart";

const ITEMS = [
  { key: "a", label: "Drinks", value: 200 },
  { key: "b", label: "Food", value: 1200, color: "danger" as const },
  { key: "c", label: "Snacks", value: 50 },
];

afterEach(() => vi.unstubAllGlobals());

describe("TreemapChart (web)", () => {
  it("draws a tile per item and gives the numbers as a table", () => {
    render(<TreemapChart items={ITEMS} label="Sales by kind" />);
    const image = screen.getByRole("img", { name: "Sales by kind" });
    expect(image.children).toHaveLength(3);
    expect(image.textContent).toContain("Food1,200");
    const table = screen.getByRole("table", { name: "Sales by kind" });
    expect(
      within(table)
        .getAllByRole("row")
        .map((row) => row.textContent),
    ).toEqual(["CategoryValue", "Drinks200", "Food1,200", "Snacks50"]);
  });

  it("sorts its tiles by label and re-lays them out once its box is measured", () => {
    const onDisconnect = vi.fn();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        disconnect = onDisconnect;

        constructor(private readonly callback: ResizeObserverCallback) {}

        observe(target: Element) {
          this.callback(
            [{ target, contentRect: { width: 960 } } as unknown as ResizeObserverEntry],
            this as unknown as ResizeObserver,
          );
        }
      },
    );
    const { unmount } = render(
      <I18nProvider locale="ar-u-nu-arab">
        <TreemapChart
          items={ITEMS}
          label="Sales"
          sort="label"
          height={120}
          valueFormat={{ style: "percent" }}
        />
      </I18nProvider>,
    );
    const tiles = [...screen.getByRole("img", { name: "Sales" }).children] as HTMLElement[];
    expect(tiles.map((tile) => tile.querySelector("span span")?.textContent)).toEqual([
      "Drinks",
      "Food",
      "Snacks",
    ]);
    expect(tiles[0]?.style.insetInlineStart).toMatch(/%$/);
    expect(screen.getByRole("table").textContent).toContain("٪");
    unmount();
    expect(onDisconnect).toHaveBeenCalled();
  });

  it("keeps its aspect when the box reports no width", () => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(private readonly callback: ResizeObserverCallback) {}

        observe() {
          this.callback([], this as unknown as ResizeObserver);
        }

        disconnect() {}
      },
    );
    render(<TreemapChart items={ITEMS.slice(0, 1)} label="One" />);
    expect((screen.getByRole("img", { name: "One" }).firstChild as HTMLElement).style.width).toBe(
      "100%",
    );
  });
});
