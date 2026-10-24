/**
 * Stackra file contract:
 * Purpose: proves the demo chart tooltip draws nothing while no point is active, and otherwise a header and one row per
 *          series with its name and formatted value.
 * Boundary: jsdom with real HeroUI Pro; no network. `stub-browser-apis` is imported first, since HeroUI Pro reads
 *          `matchMedia` as it loads.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { render, screen } from "@testing-library/react";

import "#src/__tests__/stub-browser-apis";
import { DemoChartTooltip } from "#src/components/demo-chart-tooltip";

const PAYLOAD = [
  { dataKey: "a", name: "Revenue", value: 12400, color: "red" },
  { dataKey: "b", name: "Expenses", value: 8200, color: "blue" },
];

describe("DemoChartTooltip", () => {
  it("draws nothing while no point is active", () => {
    const { container } = render(<DemoChartTooltip active={false} payload={PAYLOAD} />);
    expect(container.textContent).toBe("");
  });

  it("draws the header and one row per series", () => {
    render(<DemoChartTooltip active label="Jan" payload={PAYLOAD} />);
    expect(screen.getByText("Jan")).toBeTruthy();
    expect(screen.getByText("Revenue").parentElement?.textContent).toBe("Revenue12,400");
    expect(screen.getByText("Expenses").parentElement?.textContent).toBe("Expenses8,200");
  });

  it("formats values with the format it is given", () => {
    render(<DemoChartTooltip active payload={PAYLOAD} format={(value) => `$${value}`} />);
    expect(screen.getByText("$12400")).toBeTruthy();
  });
});
