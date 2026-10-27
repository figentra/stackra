/**
 * Stackra file contract:
 * Purpose: proves the ContextMenu page sits at /pro-context-menu in the Pro category, titles the page and the document,
 *          draws the work area with the menu closed, opens the menu from the named button, and reports the item
 *          chosen.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { fireEvent, render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProContextMenu } from "#src/routes/pro-context-menu/pro-context-menu";
import { ProContextMenuRoute } from "#src/routes/pro-context-menu/pro-context-menu.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

describe("ProContextMenu", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-context-menu in the Pro category, and titles the page and the document", () => {
    render(<ProContextMenu />);
    expect(routePath(ProContextMenuRoute)).toBe("/pro-context-menu");
    expect(ProContextMenuRoute.category).toBe("Navigation");
    expect(screen.getByRole("heading", { level: 1, name: ProContextMenuRoute.title })).toBeTruthy();
    expect(document.title).toBe("ContextMenu · Stackra Playground");
  });

  it("draws the work area with the menu closed", () => {
    render(<ProContextMenu />);
    expect(screen.getByText(/Right-click or long-press/)).toBeTruthy();
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("opens the menu from the named button, and reports the item chosen", () => {
    render(<ProContextMenu />);
    fireEvent.click(screen.getByRole("button", { name: "Open the work area menu" }));
    expect(screen.getByRole("menu")).toBeTruthy();
    fireEvent.click(screen.getByRole("menuitem", { name: "Rename" }));
    expect(screen.getByRole("status").textContent).toBe("Last item: rename");
  });
});
