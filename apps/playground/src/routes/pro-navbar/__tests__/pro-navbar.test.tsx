/**
 * Stackra file contract:
 * Purpose: proves the Navbar page sits at /pro-navbar in the Pro category, titles the page and the document, names the
 *          navigation landmark, draws the four links with the first current, and moves the current page when a link is
 *          pressed.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { fireEvent, render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProNavbar } from "#src/routes/pro-navbar/pro-navbar";
import { ProNavbarRoute } from "#src/routes/pro-navbar/pro-navbar.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

describe("ProNavbar", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-navbar in the Pro category, and titles the page and the document", () => {
    render(<ProNavbar />);
    expect(routePath(ProNavbarRoute)).toBe("/pro-navbar");
    expect(ProNavbarRoute.category).toBe("Navigation");
    expect(screen.getByRole("heading", { level: 1, name: ProNavbarRoute.title })).toBeTruthy();
    expect(document.title).toBe("Navbar · Stackra Playground");
  });

  it("names the navigation landmark and draws the four links, the first current", () => {
    render(<ProNavbar />);
    expect(screen.getByRole("navigation", { name: "Site navigation" })).toBeTruthy();
    const links = screen.getAllByRole("link", { name: /^(Overview|Customers|Pricing|Docs)$/ });
    expect(links.length).toBeGreaterThanOrEqual(4);
    expect(screen.getByRole("link", { name: "Overview", current: "page" })).toBeTruthy();
  });

  it("moves the current page when a link is pressed", () => {
    render(<ProNavbar />);
    fireEvent.click(screen.getByRole("link", { name: "Pricing" }));
    expect(screen.getByRole("status").textContent).toBe("Current page: Pricing");
    expect(screen.getByRole("link", { name: "Pricing", current: "page" })).toBeTruthy();
  });
});
