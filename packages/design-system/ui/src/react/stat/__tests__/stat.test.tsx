/**
 * Stackra file contract:
 * Purpose: proves the web `Stat` shows its label before the figure, formats a number in the provider's locale, shows
 *          a string as given, and draws the badge only when it has one.
 * Boundary: jsdom with real HeroUI; the locale comes from the design system's context.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";

import type { DesignSystemState } from "#contracts/types/design-system-state.type";
import { DesignSystemContext } from "#react/design-system-provider/design-system-context";
import { Stat } from "#react/stat/stat";

describe("Stat (web)", () => {
  it("shows the label before the figure, formatted in the provider's locale", () => {
    const { container } = render(
      <DesignSystemContext value={{ locale: "de-DE" } as DesignSystemState}>
        <Stat label="Points" value={12500} badge="Gold" />
      </DesignSystemContext>,
    );
    expect(container.textContent).toBe("Points12.500Gold");
  });

  it("shows text as given and draws no empty badge", () => {
    const { container } = render(<Stat label="Redeemed" value="−40" badge={undefined} />);
    expect(screen.getByText("−40")).toBeTruthy();
    expect(container.textContent).toBe("Redeemed−40");
  });
});
