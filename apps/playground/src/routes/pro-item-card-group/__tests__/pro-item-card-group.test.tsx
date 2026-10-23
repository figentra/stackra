/**
 * Stackra file contract:
 * Purpose: proves the ItemCardGroup page sits at /pro-item-card-group in the Pro group, titles the page and the
 *          document, draws the titled list and the grid with three cards each, and reports the card pressed.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { fireEvent, render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProItemCardGroup } from "#src/routes/pro-item-card-group/pro-item-card-group";
import { ProItemCardGroupRoute } from "#src/routes/pro-item-card-group/pro-item-card-group.route";

describe("ProItemCardGroup", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-item-card-group in the Pro group, and titles the page and the document", () => {
    render(<ProItemCardGroup />);
    expect(ProItemCardGroupRoute.path).toBe("/pro-item-card-group");
    expect(ProItemCardGroupRoute.group).toBe("Pro");
    expect(
      screen.getByRole("heading", { level: 1, name: ProItemCardGroupRoute.title }),
    ).toBeTruthy();
    expect(document.title).toBe("ItemCardGroup · Stackra Playground");
  });

  it("draws the titled list and the grid, three cards each", () => {
    render(<ProItemCardGroup />);
    expect(document.querySelectorAll('[data-slot="item-card-group"]')).toHaveLength(2);
    expect(document.querySelectorAll('[data-slot="item-card"]')).toHaveLength(6);
    expect(document.querySelector('[data-slot="item-card-group-title"]')?.textContent).toBe(
      "Integrations",
    );
  });

  it("reports the card pressed", () => {
    render(<ProItemCardGroup />);
    fireEvent.click(screen.getAllByRole("button", { name: "Manage Billing" })[0] as HTMLElement);
    expect(screen.getByRole("status").textContent).toBe("Last chosen: Billing");
  });
});
