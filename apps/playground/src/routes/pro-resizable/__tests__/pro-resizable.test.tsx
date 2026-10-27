/**
 * Stackra file contract:
 * Purpose: proves the Resizable page sits at /pro-resizable in the Pro category, titles the page and the document, draws
 *          its two groups of panels, and names each separator.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither. jsdom does no layout, so dragging a handle is checked in the browser.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProResizable } from "#src/routes/pro-resizable/pro-resizable";
import { ProResizableRoute } from "#src/routes/pro-resizable/pro-resizable.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

describe("ProResizable", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-resizable in the Pro category, and titles the page and the document", () => {
    render(<ProResizable />);
    expect(routePath(ProResizableRoute)).toBe("/pro-resizable");
    expect(ProResizableRoute.category).toBe("Layout");
    expect(screen.getByRole("heading", { level: 1, name: ProResizableRoute.title })).toBeTruthy();
    expect(document.title).toBe("Resizable · Stackra Playground");
  });

  it("draws the panels of both groups", () => {
    render(<ProResizable />);
    for (const label of ["Sidebar", "Main content", "Editor", "Console"])
      expect(screen.getByText(label)).toBeTruthy();
  });

  it("names each separator", () => {
    render(<ProResizable />);
    const separators = screen.getAllByRole("separator");
    expect(separators.map((separator) => separator.getAttribute("aria-label"))).toEqual([
      "Resize the sidebar",
      "Resize the console",
    ]);
  });
});
