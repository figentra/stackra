/**
 * Stackra file contract:
 * Purpose: proves the web `ChartTooltip` draws nothing while inactive, and otherwise the formatted title and one line
 *          per series with its label and formatted value, an indicator in the row's or series' colour, skipping
 *          hidden entries.
 * Boundary: jsdom; the payload is what Recharts hands a tooltip's content.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { render } from "@testing-library/react";

import { ChartTooltip } from "#react/chart-tooltip/chart-tooltip";

const PAYLOAD = [
  { name: "Desktop", value: 1200, color: "var(--chart-1)" },
  { name: "Mobile", value: 80, color: "var(--chart-2)", payload: { fill: "var(--chart-4)" } },
  { name: "Hidden", value: 1, type: "none" },
];

describe("ChartTooltip (web)", () => {
  it("draws nothing while inactive", () => {
    const { container } = render(<ChartTooltip active={false} payload={PAYLOAD} />);
    expect(container.innerHTML).toBe("");
  });

  it("writes the title and each series' value with its colour", () => {
    const { container } = render(
      <ChartTooltip
        active
        payload={PAYLOAD}
        label="2026-01"
        formatLabel={(label) => `Month ${String(label)}`}
        formatValue={(value) => `$${value}`}
      />,
    );
    expect(container.textContent).toBe("Month 2026-01Desktop$1200Mobile$80");
    expect(
      [...container.querySelectorAll("circle")].map((rect) => rect.getAttribute("fill")),
    ).toEqual(["var(--chart-1)", "var(--chart-4)"]);
  });
});
