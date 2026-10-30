/**
 * Stackra file contract:
 * Purpose: proves the web `TrendChip` reads its change in words with the comparison and colours by the better
 *          direction, and the web `Stat` draws its trend, target and drill-down button.
 * Boundary: jsdom with real HeroUI and English words.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { KpiGroup } from "#react/kpi-group/kpi-group";
import { Kpi } from "#react/kpi/kpi";
import { TrendChip } from "#react/kpi/trend-chip";
import { Stat } from "#react/stat/stat";

describe("TrendChip (web)", () => {
  it("reads the change in words, with the comparison", () => {
    render(<TrendChip value={0.124} comparison="vs last month" />);
    expect(screen.getByText("Up 12.4%, vs last month")).toBeTruthy();
    expect(screen.getByText("+12.4%")).toBeTruthy();
  });

  it("says no change for zero", () => {
    render(<TrendChip value={0} />);
    expect(screen.getByText("No change")).toBeTruthy();
  });
});

describe("Stat (web) KPI extras", () => {
  it("shows the trend and the target, and drills down on press", () => {
    const onPress = vi.fn();
    render(
      <Stat
        label="Revenue"
        value={800}
        trend={-0.05}
        better="down"
        target={1000}
        onPress={onPress}
      />,
    );
    expect(screen.getByText("Down 5%")).toBeTruthy();
    expect(screen.getByText("Target 1,000")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /^Revenue/, description: "Open Revenue" }));
    expect(onPress).toHaveBeenCalledOnce();
  });
});

describe("Kpi and KpiGroup (web)", () => {
  it("draws a stat in a card with a hidden icon, and groups several under one name", () => {
    const { container } = render(
      <KpiGroup label="Today" className="x-group">
        <Kpi label="Orders" value={12} icon="check" className="x-kpi" />
        <Kpi label="Refunds" value={1} />
      </KpiGroup>,
    );
    const group = screen.getByRole("group", { name: "Today" });
    expect(group.className).toContain("x-group");
    expect(screen.getByText("Orders")).toBeTruthy();
    expect(screen.getByText("Refunds")).toBeTruthy();
    expect(container.querySelectorAll("span[aria-hidden]").length).toBeGreaterThan(0);
    expect(container.querySelector(".x-kpi")).not.toBeNull();
    const cells = group.querySelectorAll(".min-w-0.px-4");
    expect(cells).toHaveLength(2);
    expect(cells[1]?.className).toContain("@xl:border-s");
    expect(cells[0]?.className).not.toContain("@xl:border-s");
  });
});
