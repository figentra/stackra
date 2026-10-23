/**
 * Stackra file contract:
 * Purpose: proves the ActionBar page sits at /pro-action-bar in the Pro category, titles the page and the document, keeps
 *          the bar closed until a file is chosen, then shows it with the count and its named actions, reports the
 *          action that ran, and closes it when the selection is cleared.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { fireEvent, render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProActionBar } from "#src/routes/pro-action-bar/pro-action-bar";
import { ProActionBarRoute } from "#src/routes/pro-action-bar/pro-action-bar.route";

describe("ProActionBar", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-action-bar in the Pro category, and titles the page and the document", () => {
    render(<ProActionBar />);
    expect(ProActionBarRoute.path).toBe("/pro-action-bar");
    expect(ProActionBarRoute.category).toBe("Pro");
    expect(screen.getByRole("heading", { level: 1, name: ProActionBarRoute.title })).toBeTruthy();
    expect(document.title).toBe("ActionBar · Stackra Playground");
  });

  it("lists five files and keeps the bar closed until one is chosen", () => {
    render(<ProActionBar />);
    expect(screen.getByRole("grid", { name: "Files" })).toBeTruthy();
    expect(screen.getAllByRole("row")).toHaveLength(5);
    expect(screen.queryByRole("toolbar")).toBeNull();
  });

  it("opens the bar on a selection, runs an action, and closes when cleared", () => {
    render(<ProActionBar />);
    fireEvent.click(screen.getAllByRole("checkbox")[0] as HTMLElement);
    expect(screen.getByRole("toolbar", { name: "Actions for the selected files" })).toBeTruthy();
    expect(screen.getByText("1 selected")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Archive" }));
    expect(screen.getByRole("status").textContent).toBe("Last action: Archive on 1 file(s)");
    fireEvent.click(screen.getByRole("button", { name: "Clear selection" }));
    for (const box of screen.getAllByRole("checkbox"))
      expect((box as HTMLInputElement).checked).toBe(false);
  });
});
