/**
 * Stackra file contract:
 * Purpose: proves the web `WidgetFrame`: a region named by its title with its body; the EmptyState and the ErrorState
 *          with a working retry; the chart card header (updated time, refresh, sort menu); the overflow menu that
 *          swaps the body for a table of its data and downloads a CSV; and the compare switch.
 * Boundary: jsdom with real HeroUI and English words; the download is caught at `URL.createObjectURL`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0307; ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen, within } from "@testing-library/react";

import { WidgetFrame } from "#react/widget-frame/widget-frame";

const DATA = {
  head: ["Month", "Sales"],
  rows: [
    ["Jan", 1200],
    ["Feb", null],
  ],
};

describe("WidgetFrame (web)", () => {
  it("is a region named by its title with its body", () => {
    render(<WidgetFrame title="Sales">body</WidgetFrame>);
    expect(screen.getByRole("region", { name: "Sales" }).textContent).toContain("body");
  });

  it("shows the empty state and the error state with retry", () => {
    const onRetry = vi.fn();
    const { rerender } = render(<WidgetFrame title="Sales" state="empty" />);
    expect(screen.getByRole("heading", { name: "No data for this range yet" })).toBeTruthy();
    rerender(<WidgetFrame title="Sales" state="error" onRetry={onRetry} />);
    expect(screen.getByRole("alert").textContent).toContain("This widget could not load");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("says when it was updated and refreshes on press", () => {
    const onRefresh = vi.fn();
    const { rerender } = render(
      <WidgetFrame title="Sales" updatedAt={Date.now() - 120_000} onRefresh={onRefresh}>
        body
      </WidgetFrame>,
    );
    expect(screen.getByText("Updated 2 min. ago")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    expect(onRefresh).toHaveBeenCalledOnce();
    rerender(
      <WidgetFrame title="Sales" onRefresh={onRefresh} isRefreshing>
        body
      </WidgetFrame>,
    );
    expect(screen.getByRole("button", { name: "Refreshing" })).toBeTruthy();
    expect(screen.getByRole("region").getAttribute("aria-busy")).toBe("true");
  });

  it("reports the order picked in the sort menu", async () => {
    const onSortChange = vi.fn();
    render(
      <WidgetFrame title="Sales" sort="value-desc" onSortChange={onSortChange}>
        body
      </WidgetFrame>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Sort" }));
    fireEvent.click(await screen.findByRole("menuitemradio", { name: "By name" }));
    expect(onSortChange).toHaveBeenCalledWith("label");
  });

  it("views its data as a table and downloads it as CSV", async () => {
    const created: Blob[] = [];
    URL.createObjectURL = vi.fn((blob: Blob) => {
      created.push(blob);
      return "blob:csv";
    });
    URL.revokeObjectURL = vi.fn();
    render(
      <WidgetFrame title="Sales" data={DATA} menu={["csv", "table"]}>
        <p>the chart</p>
      </WidgetFrame>,
    );
    fireEvent.click(screen.getByRole("button", { name: "More actions" }));
    fireEvent.click(await screen.findByRole("menuitem", { name: "View as table" }));
    const table = screen.getByRole("table", { name: "Sales" });
    expect(within(table).getAllByRole("row")[1]?.textContent).toBe("Jan1,200");
    expect(screen.queryByText("the chart")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "More actions" }));
    expect(await screen.findByRole("menuitem", { name: "View as chart" })).toBeTruthy();
    fireEvent.click(screen.getByRole("menuitem", { name: "Download CSV" }));
    const bytes = new Uint8Array((await created[0]?.arrayBuffer()) ?? new ArrayBuffer(0));
    // A byte-order mark first, so a spreadsheet reads Arabic labels as UTF-8.
    expect(bytes.slice(0, 3)).toEqual(new Uint8Array([0xef, 0xbb, 0xbf]));
    expect(await created[0]?.text()).toBe("Month,Sales\r\nJan,1200\r\nFeb,\r\n");
  });

  it("shows the compare switch and reports it", () => {
    const onCompareChange = vi.fn();
    render(
      <WidgetFrame title="Sales" isComparing={false} onCompareChange={onCompareChange}>
        body
      </WidgetFrame>,
    );
    fireEvent.click(screen.getByRole("switch", { name: "Compare to previous period" }));
    expect(onCompareChange).toHaveBeenCalledWith(true);
  });
});
