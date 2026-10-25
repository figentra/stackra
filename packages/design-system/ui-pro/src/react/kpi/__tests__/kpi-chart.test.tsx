/**
 * Stackra file contract:
 * Purpose: proves `Kpi.Chart` turns the sparkline's animation back on (Recharts' `auto`, so it stays still under reduced
 *          motion) with the theme's reveal step, lets a caller's `areaProps` win, and passes other props through.
 * Boundary: HeroUI Pro's chart is replaced by a recording stand-in, so what reaches HeroUI Pro is checked, not Recharts'
 *          drawing.
 * Runtime: browser
 * Governing contract: ADR 0329 (motion layer); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-430:FR-005 sta-430:P-001 sta-430:P-002
import { render } from "@testing-library/react";

import { KpiChart } from "#react/kpi/kpi-chart";

const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("@heroui-pro/react/kpi", () => ({
  KPI: {
    Chart: (props: Record<string, unknown>) => {
      received.props = props;
      return null;
    },
  },
}));

const DATA = [{ value: 1 }, { value: 3 }];

describe("Kpi.Chart (web)", () => {
  it("draws the sparkline in on the theme's reveal step, still under reduced motion", () => {
    render(<KpiChart data={DATA} dataKey="value" />);
    expect(received.props["areaProps"]).toEqual({
      isAnimationActive: "auto",
      animationDuration: 400,
      animationEasing: "cubic-bezier(0.22,1,0.36,1)",
    });
    expect(received.props["data"]).toBe(DATA);
  });

  it("lets the caller's areaProps win", () => {
    render(<KpiChart data={DATA} dataKey="value" areaProps={{ isAnimationActive: false }} />);
    expect((received.props["areaProps"] as Record<string, unknown>)["isAnimationActive"]).toBe(
      false,
    );
  });
});
