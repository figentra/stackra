/**
 * Stackra file contract:
 * Purpose: proves the AppLayout page sits at /pro-app-layout in the Pro group and draws its own main landmark,
 *          titles the page and the document, draws the sidebar, the top bar with its three named buttons, the main
 *          content and the aside, toggles the aside from its trigger, and moves the current page from the sidebar.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither, so the narrow-viewport sheet is checked by the e2e suite, which has a real layout.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0304 (decision 6); ADR 0022 (test placement).
 */
// @covers sta-403:FR-013
import { fireEvent, render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProAppLayout } from "#src/routes/pro-app-layout/pro-app-layout";
import { ProAppLayoutRoute } from "#src/routes/pro-app-layout/pro-app-layout.route";

describe("ProAppLayout", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-app-layout in the Pro group, owns its main, and titles the page and the document", () => {
    render(<ProAppLayout />);
    expect(ProAppLayoutRoute.path).toBe("/pro-app-layout");
    expect(ProAppLayoutRoute.group).toBe("Pro");
    expect(ProAppLayoutRoute.ownsMain).toBe(true);
    expect(screen.getByRole("heading", { level: 1, name: ProAppLayoutRoute.title })).toBeTruthy();
    expect(document.title).toBe("AppLayout · Stackra Playground");
  });

  it("draws one main landmark, the named sidebar and the top bar's named buttons", () => {
    render(<ProAppLayout />);
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getByRole("complementary", { name: "Primary navigation" })).toBeTruthy();
    for (const name of [
      "Open navigation",
      "Collapse or expand the sidebar",
      "Show or hide the details panel",
    ])
      expect(screen.getByRole("button", { name })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Overview" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Details" })).toBeTruthy();
  });

  it("opens and closes the aside from its trigger", () => {
    render(<ProAppLayout />);
    const trigger = screen.getByRole("button", { name: "Show or hide the details panel" });
    const aside = screen.getByRole("heading", { name: "Details" }).closest("aside");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(aside?.getAttribute("data-state")).toBe("open");
    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(aside?.getAttribute("data-state")).toBe("closed");
  });

  it("moves the current page from the sidebar", () => {
    render(<ProAppLayout />);
    expect(screen.getByRole("status").textContent).toBe("Current page: Dashboard");
    fireEvent.click(screen.getByRole("row", { name: "Customers" }));
    expect(screen.getByRole("status").textContent).toBe("Current page: Customers");
  });
});
