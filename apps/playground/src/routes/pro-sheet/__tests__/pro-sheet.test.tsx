/**
 * Stackra file contract:
 * Purpose: proves the Sheet page sits at /pro-sheet in the Pro category, titles the page and the document, keeps both
 *          sheets closed until their buttons are pressed, opens the bottom sheet as a dialog named by its heading, and
 *          reports the answer when the sheet is confirmed.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { fireEvent, render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProSheet } from "#src/routes/pro-sheet/pro-sheet";
import { ProSheetRoute } from "#src/routes/pro-sheet/pro-sheet.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

describe("ProSheet", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-sheet in the Pro category, and titles the page and the document", () => {
    render(<ProSheet />);
    expect(routePath(ProSheetRoute)).toBe("/pro-sheet");
    expect(ProSheetRoute.category).toBe("Overlays");
    expect(screen.getByRole("heading", { level: 1, name: ProSheetRoute.title })).toBeTruthy();
    expect(document.title).toBe("Sheet · Stackra Playground");
  });

  it("keeps both sheets closed until their buttons are pressed", () => {
    render(<ProSheet />);
    expect(screen.getByRole("button", { name: "Open the bottom sheet" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Open the side sheet" })).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens the bottom sheet as a named dialog, and reports the answer when it is confirmed", () => {
    render(<ProSheet />);
    fireEvent.click(screen.getByRole("button", { name: "Open the bottom sheet" }));
    expect(screen.getByRole("dialog", { name: "Share this report" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(screen.getByRole("status").textContent).toBe("Last answer: Confirm");
  });
});
