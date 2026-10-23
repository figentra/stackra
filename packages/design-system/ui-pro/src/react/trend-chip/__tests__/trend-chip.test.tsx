/**
 * Stackra file contract:
 * Purpose: proves the web TrendChip passes `size` and `variant` to HeroUI Pro's chip, leaves HeroUI Pro's defaults when
 *          they are left out, draws the trend, passes unknown props through, and carries HeroUI Pro's parts.
 * Boundary: jsdom with real HeroUI Pro; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0304 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-403:FR-007
import { TrendChip as HeroTrendChip } from "@heroui-pro/react/trend-chip";
import { render, screen } from "@testing-library/react";

import { TrendChipVariant } from "#contracts/enums/trend-chip-variant.enum";
import { TrendChip } from "#react/trend-chip/trend-chip";

describe("TrendChip (web)", () => {
  it.each(TrendChipVariant)("draws the %s variant", (variant) => {
    render(
      <TrendChip variant={variant} data-testid="chip">
        5%
      </TrendChip>,
    );
    expect(screen.getByTestId("chip").classList.contains(`chip--${variant}`)).toBe(true);
  });

  it("passes the size, and leaves HeroUI Pro's defaults when nothing is given", () => {
    const { rerender } = render(
      <TrendChip size="lg" data-testid="chip">
        5%
      </TrendChip>,
    );
    expect(screen.getByTestId("chip").classList.contains("chip--lg")).toBe(true);
    rerender(<TrendChip data-testid="chip">5%</TrendChip>);
    const chip = screen.getByTestId("chip");
    expect(chip.classList.contains("chip--sm")).toBe(true);
    expect(chip.classList.contains("chip--soft")).toBe(true);
  });

  it("draws the trend and passes unknown props through", () => {
    render(
      <TrendChip trend="down" id="c" className="extra" data-testid="chip">
        <TrendChip.Indicator>
          <svg data-testid="arrow" />
        </TrendChip.Indicator>
        <TrendChip.Prefix>-</TrendChip.Prefix>2<TrendChip.Suffix>%</TrendChip.Suffix>
      </TrendChip>,
    );
    const chip = screen.getByTestId("chip");
    expect(chip.id).toBe("c");
    expect(chip.classList.contains("extra")).toBe(true);
    expect(chip.textContent).toMatch(/-\s*2\s*%/);
    expect(screen.getByTestId("arrow")).toBeTruthy();
  });

  it("draws HeroUI Pro's directional arrow when no indicator is given", () => {
    render(<TrendChip data-testid="chip">5%</TrendChip>);
    expect(screen.getByTestId("chip").querySelector("svg")).toBeTruthy();
  });

  it("carries HeroUI Pro's own parts", () => {
    expect(TrendChip.Indicator).toBe(HeroTrendChip.Indicator);
    expect(TrendChip.Prefix).toBe(HeroTrendChip.Prefix);
    expect(TrendChip.Suffix).toBe(HeroTrendChip.Suffix);
  });
});
