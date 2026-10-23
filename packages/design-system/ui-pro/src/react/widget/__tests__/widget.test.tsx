/**
 * Stackra file contract:
 * Purpose: proves the web Widget draws its card in HeroUI Pro's parts, passes unknown props and a legend item's
 *          CSS `color` through unchanged, and carries HeroUI Pro's own parts.
 * Boundary: jsdom with real HeroUI Pro; the theme CSS is not loaded, so attributes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-005
import { Widget as HeroWidget } from "@heroui-pro/react/widget";
import { render, screen } from "@testing-library/react";

import { Widget } from "#react/widget/widget";

describe("Widget (web)", () => {
  it("draws the card in HeroUI Pro's parts and passes unknown props through", () => {
    render(
      <Widget data-testid="widget" className="extra">
        <Widget.Header>
          <Widget.Title>Revenue</Widget.Title>
          <Widget.Description>Last 30 days</Widget.Description>
        </Widget.Header>
        <Widget.Content>chart</Widget.Content>
        <Widget.Legend>
          <Widget.LegendItem color="#ff0000" data-testid="legend">
            Online
          </Widget.LegendItem>
        </Widget.Legend>
        <Widget.Footer>Updated today</Widget.Footer>
      </Widget>,
    );
    expect(screen.getByTestId("widget").classList.contains("extra")).toBe(true);
    for (const text of ["Revenue", "Last 30 days", "chart", "Online", "Updated today"]) {
      expect(screen.getByText(text)).toBeTruthy();
    }
    expect(screen.getByTestId("legend").outerHTML).toContain("rgb(255, 0, 0)");
  });

  it("carries HeroUI Pro's own parts", () => {
    for (const part of [
      "Header",
      "Title",
      "Description",
      "Content",
      "Footer",
      "Legend",
      "LegendItem",
    ] as const) {
      expect(Widget[part]).toBe(HeroWidget[part]);
    }
  });
});
