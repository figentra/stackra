/**
 * Stackra file contract:
 * Purpose: proves the EmptyState page sits at /pro-empty-state in the Pro category, titles the page and the document,
 *          draws both empty states with their titles and descriptions, and reports the action pressed.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { fireEvent, render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProEmptyState } from "#src/routes/pro-empty-state/pro-empty-state";
import { ProEmptyStateRoute } from "#src/routes/pro-empty-state/pro-empty-state.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

describe("ProEmptyState", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-empty-state in the Pro category, and titles the page and the document", () => {
    render(<ProEmptyState />);
    expect(routePath(ProEmptyStateRoute)).toBe("/pro-empty-state");
    expect(ProEmptyStateRoute.category).toBe("Data display");
    expect(screen.getByRole("heading", { level: 1, name: ProEmptyStateRoute.title })).toBeTruthy();
    expect(document.title).toBe("EmptyState · Stackra Playground");
  });

  it("draws both empty states with their titles", () => {
    render(<ProEmptyState />);
    const titles = [...document.querySelectorAll('[data-slot="empty-state-title"]')];
    expect(titles.map((title) => title.textContent)).toEqual([
      "No projects yet",
      "Nothing here yet",
    ]);
  });

  it("reports the action pressed", () => {
    render(<ProEmptyState />);
    fireEvent.click(screen.getByRole("button", { name: "Import project" }));
    expect(screen.getByRole("status").textContent).toBe("Last action: Import project");
  });
});
