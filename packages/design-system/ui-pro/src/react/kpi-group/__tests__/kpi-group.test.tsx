/**
 * Stackra file contract:
 * Purpose: proves the web KpiGroup groups this package's `Kpi` cards with a separator, passes HeroUI Pro's own
 *          `orientation` and unknown props through, and carries HeroUI Pro's own part.
 * Boundary: jsdom with real HeroUI Pro; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-005
import { KPIGroup as HeroKpiGroup } from "@heroui-pro/react/kpi-group";
import { render, screen } from "@testing-library/react";

import { Kpi } from "#react/kpi/kpi";
import { KpiGroup, type KpiGroupProps } from "#react/kpi-group/kpi-group";

describe("KpiGroup (web)", () => {
  it("groups Kpi cards and passes unknown props through", () => {
    render(
      <KpiGroup data-testid="group" className="extra">
        <Kpi>
          <Kpi.Header>
            <Kpi.Title>Revenue</Kpi.Title>
          </Kpi.Header>
        </Kpi>
        <KpiGroup.Separator data-testid="separator" />
        <Kpi>
          <Kpi.Header>
            <Kpi.Title>Orders</Kpi.Title>
          </Kpi.Header>
        </Kpi>
      </KpiGroup>,
    );
    const group = screen.getByTestId("group");
    expect(group.classList.contains("extra")).toBe(true);
    expect(screen.getByText("Revenue")).toBeTruthy();
    expect(screen.getByText("Orders")).toBeTruthy();
    expect(group.contains(screen.getByTestId("separator"))).toBe(true);
  });

  it("passes HeroUI Pro's own orientation through", () => {
    const { rerender } = render(
      <KpiGroup data-testid="group" orientation="vertical">
        x
      </KpiGroup>,
    );
    const vertical = screen.getByTestId("group").outerHTML;
    rerender(<KpiGroup data-testid="group">x</KpiGroup>);
    expect(screen.getByTestId("group").outerHTML).not.toBe(vertical);
    rerender(
      <HeroKpiGroup.Root data-testid="group" orientation="vertical">
        x
      </HeroKpiGroup.Root>,
    );
    expect(screen.getByTestId("group").outerHTML).toBe(vertical);
  });

  it("carries HeroUI Pro's own part", () => {
    expect(KpiGroup.Separator).toBe(HeroKpiGroup.Separator);
  });

  it("takes children and HeroUI Pro's own orientation", () => {
    expectTypeOf<KpiGroupProps>().toHaveProperty("children");
    expectTypeOf<KpiGroupProps>().toHaveProperty("orientation");
  });
});
