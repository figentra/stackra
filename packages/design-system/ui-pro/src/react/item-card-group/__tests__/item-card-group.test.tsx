/**
 * Stackra file contract:
 * Purpose: proves the web ItemCardGroup draws its header and the ItemCards inside it, passes HeroUI Pro's own
 *          `layout`, `columns` and unknown props through, and carries HeroUI Pro's own parts.
 * Boundary: jsdom with real HeroUI Pro; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-005
import { ItemCardGroup as HeroItemCardGroup } from "@heroui-pro/react/item-card-group";
import { render, screen } from "@testing-library/react";

import { ItemCard } from "#react/item-card/item-card";
import { ItemCardGroup, type ItemCardGroupProps } from "#react/item-card-group/item-card-group";

describe("ItemCardGroup (web)", () => {
  it("draws the header and the item cards, and passes unknown props through", () => {
    render(
      <ItemCardGroup data-testid="group" className="extra">
        <ItemCardGroup.Header>
          <ItemCardGroup.Title>Alerts</ItemCardGroup.Title>
          <ItemCardGroup.Description>Where we reach you</ItemCardGroup.Description>
        </ItemCardGroup.Header>
        <ItemCard>
          <ItemCard.Title>Email</ItemCard.Title>
        </ItemCard>
      </ItemCardGroup>,
    );
    const group = screen.getByTestId("group");
    expect(group.classList.contains("extra")).toBe(true);
    expect(screen.getByRole("heading", { name: "Alerts" })).toBeTruthy();
    expect(screen.getByText("Where we reach you")).toBeTruthy();
    expect(group.textContent).toContain("Email");
  });

  it("passes HeroUI Pro's own layout and columns through", () => {
    const { rerender } = render(
      <ItemCardGroup data-testid="group" layout="grid" columns={3}>
        x
      </ItemCardGroup>,
    );
    const grid = screen.getByTestId("group").outerHTML;
    rerender(<ItemCardGroup data-testid="group">x</ItemCardGroup>);
    expect(screen.getByTestId("group").outerHTML).not.toBe(grid);
    rerender(
      <HeroItemCardGroup.Root data-testid="group" layout="grid" columns={3}>
        x
      </HeroItemCardGroup.Root>,
    );
    expect(screen.getByTestId("group").outerHTML).toBe(grid);
  });

  it("carries HeroUI Pro's own parts", () => {
    for (const part of ["Header", "Title", "Description"] as const) {
      expect(ItemCardGroup[part]).toBe(HeroItemCardGroup[part]);
    }
  });

  it("takes children and HeroUI Pro's own layout", () => {
    expectTypeOf<ItemCardGroupProps>().toHaveProperty("children");
    expectTypeOf<ItemCardGroupProps>().toHaveProperty("layout");
  });
});
