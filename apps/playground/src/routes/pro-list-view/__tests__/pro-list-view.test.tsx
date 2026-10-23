/**
 * Stackra file contract:
 * Purpose: proves the ListView page sits at /pro-list-view in the Pro category, titles the page and the document, draws
 *          the four files and the empty list, reports the file chosen, and names each row's action.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { fireEvent, render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProListView } from "#src/routes/pro-list-view/pro-list-view";
import { ProListViewRoute } from "#src/routes/pro-list-view/pro-list-view.route";

describe("ProListView", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-list-view in the Pro category, and titles the page and the document", () => {
    render(<ProListView />);
    expect(ProListViewRoute.path).toBe("/pro-list-view");
    expect(ProListViewRoute.category).toBe("Pro");
    expect(screen.getByRole("heading", { level: 1, name: ProListViewRoute.title })).toBeTruthy();
    expect(document.title).toBe("ListView · Stackra Playground");
  });

  it("draws the four files in a named list, and the empty list's message", () => {
    render(<ProListView />);
    const list = screen.getByRole("grid", { name: "Files" });
    expect(list.querySelectorAll('[role="row"]')).toHaveLength(4);
    expect(screen.getByText("No archived files.")).toBeTruthy();
  });

  it("reports the file chosen, and names each row's action", () => {
    render(<ProListView />);
    fireEvent.click(screen.getByText("Photos"));
    expect(screen.getByRole("status").textContent).toBe("Chosen: Photos");
    expect(screen.getByRole("button", { name: "More actions for README.md" })).toBeTruthy();
  });
});
