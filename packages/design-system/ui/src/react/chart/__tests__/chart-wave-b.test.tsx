/**
 * Stackra file contract:
 * Purpose: proves the wave-B cartesian chart options on the web: annotations are read after the data table, a series
 *          on the second value axis keeps its column in the table, a log scale and a shared `syncId` draw without
 *          error, `axisOf` sends only the secondary series to the second axis, and the widget frame downloads its
 *          chart as a standalone SVG.
 * Boundary: jsdom; Recharts measures nothing there, so the drawn plots are proven by the playground screenshots.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); WCAG 2.2 SC 1.1.1; STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen, within } from "@testing-library/react";

import { ComposedChart } from "#react/composed-chart/composed-chart";
import { axisOf } from "#react/chart/axis-of.function";
import { LineChart } from "#react/line-chart/line-chart";
import { WidgetFrame } from "#react/widget-frame/widget-frame";

const DATA = [
  { month: "Jan", orders: 120, revenue: 48_000 },
  { month: "Feb", orders: 90, revenue: 31_000 },
  { month: "Mar", orders: 160, revenue: 72_000 },
];

describe("wave-B chart options (web)", () => {
  it("reads each annotation after the data table", () => {
    render(
      <LineChart
        data={DATA}
        series={[{ key: "orders", label: "Orders" }]}
        xKey="month"
        label="Orders"
        annotations={[{ at: "Mar", label: "Launch" }]}
        references={[{ value: 100, label: "Target" }]}
      />,
    );
    const notes = screen.getAllByRole("listitem").map((item) => item.textContent);
    expect(notes).toEqual(["Target: 100", "Launch: Mar"]);
  });

  it("keeps a second-axis series in the table, on a log scale, synced", () => {
    render(
      <ComposedChart
        data={DATA}
        series={[
          { key: "orders", label: "Orders" },
          { key: "revenue", label: "Revenue" },
        ]}
        lineKeys={["revenue"]}
        secondaryKeys={["revenue"]}
        valueScale="log"
        syncId="sales"
        xKey="month"
        label="Orders and revenue"
      />,
    );
    const rows = within(screen.getByRole("table"))
      .getAllByRole("row")
      .map((row) => row.textContent);
    expect(rows[0]).toBe("CategoryOrdersRevenue");
    expect(rows[3]).toBe("Mar16072,000");
  });

  it("sends only the secondary series to the second axis", () => {
    expect(axisOf("revenue", ["revenue"])).toEqual({ yAxisId: "secondary" });
    expect(axisOf("orders", ["revenue"])).toEqual({});
    expect(axisOf("orders", undefined)).toEqual({});
  });

  it("downloads its chart as a standalone SVG", async () => {
    const created: Blob[] = [];
    URL.createObjectURL = vi.fn((blob: Blob) => {
      created.push(blob);
      return "blob:svg";
    });
    URL.revokeObjectURL = vi.fn();
    render(
      <WidgetFrame title="Sales" menu={["svg"]}>
        <svg data-chart="" width="10" height="10">
          <rect width="10" height="10" fill="red" />
        </svg>
      </WidgetFrame>,
    );
    fireEvent.click(screen.getByRole("button", { name: "More actions" }));
    fireEvent.click(await screen.findByRole("menuitem", { name: "Download SVG" }));
    expect(created[0]?.type).toBe("image/svg+xml;charset=utf-8");
    const source = (await created[0]?.text()) ?? "";
    expect(source).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(source).toContain("<rect");
  });
});
