/**
 * Stackra file contract:
 * Purpose: proves the web ItemCard draws its parts, passes HeroUI Pro's own `variant` and unknown props through, and
 *          carries HeroUI Pro's own parts.
 * Boundary: jsdom with real HeroUI Pro; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-005
import { ItemCard as HeroItemCard } from "@heroui-pro/react/item-card";
import { render, screen } from "@testing-library/react";

import { ItemCard, type ItemCardProps } from "#react/item-card/item-card";

describe("ItemCard (web)", () => {
  it("draws the parts and passes unknown props through", () => {
    render(
      <ItemCard data-testid="card" className="extra">
        <ItemCard.Icon>i</ItemCard.Icon>
        <ItemCard.Content>
          <ItemCard.Title>Notifications</ItemCard.Title>
          <ItemCard.Description>Email and push</ItemCard.Description>
        </ItemCard.Content>
        <ItemCard.Action>on</ItemCard.Action>
      </ItemCard>,
    );
    const card = screen.getByTestId("card");
    expect(card.classList.contains("extra")).toBe(true);
    expect(card.textContent).toContain("Notifications");
    expect(screen.getByText("Email and push")).toBeTruthy();
    expect(screen.getByText("on")).toBeTruthy();
  });

  it("passes HeroUI Pro's own variant through", () => {
    const { rerender } = render(
      <ItemCard data-testid="card" variant="outline">
        x
      </ItemCard>,
    );
    const outlined = screen.getByTestId("card").outerHTML;
    rerender(<ItemCard data-testid="card">x</ItemCard>);
    expect(screen.getByTestId("card").outerHTML).not.toBe(outlined);
    rerender(
      <HeroItemCard.Root data-testid="card" variant="outline">
        x
      </HeroItemCard.Root>,
    );
    expect(screen.getByTestId("card").outerHTML).toBe(outlined);
  });

  it("carries HeroUI Pro's own parts", () => {
    for (const part of ["Icon", "Content", "Title", "Description", "Action"] as const) {
      expect(ItemCard[part]).toBe(HeroItemCard[part]);
    }
  });

  it("takes children and HeroUI Pro's own variant", () => {
    expectTypeOf<ItemCardProps>().toHaveProperty("children");
    expectTypeOf<ItemCardProps>().toHaveProperty("variant");
  });
});
