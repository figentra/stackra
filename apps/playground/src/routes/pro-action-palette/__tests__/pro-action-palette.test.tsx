/**
 * Stackra file contract:
 * Purpose: proves the ActionPalette page sits at /pro-action-palette in the Pro group, titles the page and the
 *          document, stays closed until the button is pressed or Ctrl or Cmd with K is pressed, lists the actions in
 *          their groups, filters them as the search changes, and runs an action, which closes the palette and is
 *          reported.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0310 (decision 6); ADR 0022 (test placement).
 */
// @covers sta-403:FR-013
import { act, fireEvent, render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProActionPalette } from "#src/routes/pro-action-palette/pro-action-palette";
import { ProActionPaletteRoute } from "#src/routes/pro-action-palette/pro-action-palette.route";

describe("ProActionPalette", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-action-palette in the Pro group, and titles the page and the document", () => {
    render(<ProActionPalette />);
    expect(ProActionPaletteRoute.path).toBe("/pro-action-palette");
    expect(ProActionPaletteRoute.category).toBe("Pro");
    expect(
      screen.getByRole("heading", { level: 1, name: ProActionPaletteRoute.title }),
    ).toBeTruthy();
    expect(document.title).toBe("ActionPalette · Stackra Playground");
  });

  it("stays closed until the button is pressed, then lists the actions in three groups", () => {
    render(<ProActionPalette />);
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Open action palette/ }));
    expect(screen.getByRole("dialog", { name: "Action palette" })).toBeTruthy();
    expect(screen.getByRole("searchbox", { name: "Search actions" })).toBeTruthy();
    expect(screen.getAllByRole("menuitem")).toHaveLength(6);
    for (const heading of ["Navigate", "Create", "Settings"])
      expect(screen.getByText(heading)).toBeTruthy();
  });

  it("opens from Ctrl or Cmd with K", () => {
    render(<ProActionPalette />);
    act(() => {
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    });
    expect(screen.getByRole("dialog", { name: "Action palette" })).toBeTruthy();
  });

  it("filters the actions as the search changes, and says so when none match", () => {
    render(<ProActionPalette />);
    fireEvent.click(screen.getByRole("button", { name: /Open action palette/ }));
    const search = screen.getByRole("searchbox");
    act(() => {
      fireEvent.change(search, { target: { value: "invoice" } });
    });
    expect(screen.getAllByRole("menuitem").map((item) => item.textContent)).toEqual([
      "Go to invoices",
      "Create invoice",
    ]);
    act(() => {
      fireEvent.change(search, { target: { value: "zzz" } });
    });
    expect(screen.queryByRole("menuitem", { name: "Go to invoices" })).toBeNull();
    expect(screen.getByText("No actions match.")).toBeTruthy();
  });

  it("runs an action: the palette closes and the action is reported", () => {
    render(<ProActionPalette />);
    expect(screen.getByRole("status").textContent).toBe("No action has run yet.");
    fireEvent.click(screen.getByRole("button", { name: /Open action palette/ }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Invite teammate" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("status").textContent).toBe("Last action: Invite teammate");
  });
});
