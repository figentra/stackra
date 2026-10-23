/**
 * Stackra file contract:
 * Purpose: proves the Sidebar page sits at /pro-sidebar in the Pro group, titles the page and the document, draws a
 *          named sidebar with its menu, footer and toggle, shows the submenu expanded, and moves the current item when
 *          an item is pressed.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither, so collapsing is checked by the e2e suite, which has a real layout.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0304 (decision 6); ADR 0022 (test placement).
 */
// @covers sta-403:FR-013
import { fireEvent, render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProSidebar } from "#src/routes/pro-sidebar/pro-sidebar";
import { ProSidebarRoute } from "#src/routes/pro-sidebar/pro-sidebar.route";

describe("ProSidebar", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-sidebar in the Pro group, and titles the page and the document", () => {
    render(<ProSidebar />);
    expect(ProSidebarRoute.path).toBe("/pro-sidebar");
    expect(ProSidebarRoute.group).toBe("Pro");
    expect(screen.getByRole("heading", { level: 1, name: ProSidebarRoute.title })).toBeTruthy();
    expect(document.title).toBe("Sidebar · Stackra Playground");
  });

  it("draws a named sidebar with its menus and a named toggle, and no second main landmark", () => {
    render(<ProSidebar />);
    expect(screen.getByRole("complementary", { name: "Primary navigation" })).toBeTruthy();
    expect(screen.getByRole("treegrid", { name: "Workspace navigation" })).toBeTruthy();
    expect(screen.getByRole("treegrid", { name: "Account navigation" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Collapse or expand the sidebar" })).toBeTruthy();
    expect(screen.queryByRole("main")).toBeNull();
  });

  it("shows the Reports submenu expanded, with the Dashboard as the current page", () => {
    render(<ProSidebar />);
    expect(screen.getByRole("row", { name: "Overview" })).toBeTruthy();
    expect(screen.getByRole("row", { name: "Revenue" })).toBeTruthy();
    expect(screen.getByRole("row", { name: "Dashboard" }).getAttribute("data-current")).toBe(
      "true",
    );
    expect(screen.getByRole("status").textContent).toBe("Current page: Dashboard");
  });

  it("moves the current page when an item is pressed", () => {
    render(<ProSidebar />);
    fireEvent.click(screen.getByRole("row", { name: "Orders" }));
    expect(screen.getByRole("status").textContent).toBe("Current page: Orders");
    expect(screen.getByRole("row", { name: "Orders" }).getAttribute("data-current")).toBe("true");
    expect(screen.getByRole("row", { name: "Dashboard" }).hasAttribute("data-current")).toBe(false);
  });
});
