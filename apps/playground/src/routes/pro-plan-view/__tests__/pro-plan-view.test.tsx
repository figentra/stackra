/**
 * Stackra file contract:
 * Purpose: proves the Plan view page sits at /pro-plan-view in the AI category, titles the page and the document, and
 *          draws the five steps under a named list with each status read as a word.
 * Boundary: jsdom with real HeroUI Pro; `matchMedia` and `ResizeObserver` are stubbed because jsdom has neither.
 * Runtime: browser
 * Governing contract: ADR 0245 (decision 8); ADR 0022 (test placement).
 */
import { render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProPlanView } from "#src/routes/pro-plan-view/pro-plan-view";
import { ProPlanViewRoute } from "#src/routes/pro-plan-view/pro-plan-view.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

describe("ProPlanView", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-plan-view in the AI category, and titles the page and the document", () => {
    render(<ProPlanView />);
    expect(routePath(ProPlanViewRoute)).toBe("/pro-plan-view");
    expect(screen.getByRole("heading", { level: 1, name: ProPlanViewRoute.title })).toBeTruthy();
    expect(document.title).toBe("Plan view · Stackra Playground");
  });

  it("reads each step's status as a word", () => {
    const { container } = render(<ProPlanView />);
    expect(screen.getByRole("list", { name: "Plan to restock low items" })).toBeTruthy();
    expect(container.querySelectorAll("[data-step-status]")).toHaveLength(5);
    for (const word of ["Done", "Running", "Pending", "Failed", "Skipped"])
      expect(container.textContent).toContain(`(${word})`);
  });
});
