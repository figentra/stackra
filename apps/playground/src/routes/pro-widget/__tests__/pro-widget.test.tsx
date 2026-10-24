/**
 * Stackra file contract:
 * Purpose: proves the Widget page sits at /pro-widget in the Pro category, titles the page and the document, draws two
 *          widgets with their titles, and gives the first its legend, its three values in text and its footer.
 * Boundary: jsdom with real HeroUI Pro; `matchMedia` and `ResizeObserver` are stubbed because jsdom has neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProWidget } from "#src/routes/pro-widget/pro-widget";
import { ProWidgetRoute } from "#src/routes/pro-widget/pro-widget.route";

describe("ProWidget", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-widget in the Pro category, and titles the page and the document", () => {
    render(<ProWidget />);
    expect(ProWidgetRoute.path).toBe("/pro-widget");
    expect(ProWidgetRoute.category).toBe("Data display");
    expect(screen.getByRole("heading", { level: 1, name: ProWidgetRoute.title })).toBeTruthy();
    expect(document.title).toBe("Widget · Stackra Playground");
  });

  it("draws two widgets with their titles", () => {
    render(<ProWidget />);
    const titles = [...document.querySelectorAll('[data-slot="widget-title"]')];
    expect(titles.map((title) => title.textContent)).toEqual(["Visits by source", "Next review"]);
  });

  it("gives the first widget its legend, its values in text and its footer", () => {
    render(<ProWidget />);
    expect(document.querySelectorAll('[data-slot="widget-legend-item"]')).toHaveLength(3);
    for (const value of ["4,200", "3,100", "1,300"]) expect(screen.getByText(value)).toBeTruthy();
    expect(screen.getByText("Updated an hour ago")).toBeTruthy();
  });
});
