/**
 * Stackra file contract:
 * Purpose: proves the ItemCard page sits at /pro-item-card in the Pro group, titles the page and the document, draws
 *          three cards with their titles, turns the named switch off and says so, and revokes the tablet.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { fireEvent, render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProItemCard } from "#src/routes/pro-item-card/pro-item-card";
import { ProItemCardRoute } from "#src/routes/pro-item-card/pro-item-card.route";

describe("ProItemCard", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-item-card in the Pro group, and titles the page and the document", () => {
    render(<ProItemCard />);
    expect(ProItemCardRoute.path).toBe("/pro-item-card");
    expect(ProItemCardRoute.group).toBe("Pro");
    expect(screen.getByRole("heading", { level: 1, name: ProItemCardRoute.title })).toBeTruthy();
    expect(document.title).toBe("ItemCard · Stackra Playground");
  });

  it("draws three cards with their titles", () => {
    render(<ProItemCard />);
    const titles = [...document.querySelectorAll('[data-slot="item-card-title"]')];
    expect(titles.map((title) => title.textContent)).toEqual([
      "Email notifications",
      "Work laptop",
      "Tablet",
    ]);
  });

  it("turns the named switch off and says so", () => {
    render(<ProItemCard />);
    const toggle = screen.getByRole("switch", { name: "Email notifications" });
    expect((toggle as HTMLInputElement).checked).toBe(true);
    fireEvent.click(toggle);
    expect(screen.getByText("Notifications are off.")).toBeTruthy();
  });

  it("revokes the tablet", () => {
    render(<ProItemCard />);
    fireEvent.click(screen.getByRole("button", { name: "Revoke Tablet" }));
    expect(screen.getByText("The tablet has been revoked.")).toBeTruthy();
  });
});
