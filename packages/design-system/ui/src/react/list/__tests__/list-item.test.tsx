/**
 * Stackra file contract:
 * Purpose: proves the web ListItem is a `li` that keeps its caller's props, class and ref, draws a plain row as content
 *          and a pressable one as HeroUI's ghost button that fills the row, names the end text and title slots, and
 *          refuses the names the contract replaces.
 * Boundary: jsdom with real HeroUI; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0313 (text slots); ADR 0022 (test placement); WCAG 2.2 SC 2.5.8.
 */
// @vitest-environment jsdom
// @covers sta-350:FR-127 sta-350:P-064
import { act, render, screen } from "@testing-library/react";
import { createRef } from "react";

import type { ListItemContractProps } from "#contracts/types/list-item-contract-props.type";
import { ListItem, type ListItemProps } from "#react/list/list-item";

describe("ListItem (web)", () => {
  it("is a `li` that keeps the caller's props, class and ref", () => {
    const ref = createRef<HTMLLIElement>();
    render(
      <ul>
        <ListItem ref={ref} title="Alpha" data-testid="row" className="mine" />
      </ul>,
    );
    const row = screen.getByTestId("row");
    expect(row.tagName).toBe("LI");
    expect(ref.current).toBe(row);
    expect(row.classList.contains("mine")).toBe(true);
  });

  it("draws a plain row as content, not as a button", () => {
    render(
      <ul>
        <ListItem title="Alpha" description="First" />
      </ul>,
    );
    expect(screen.queryByRole("button")).toBeNull();
    // Plain spans: a React Aria slot would name an option by its title alone and leave the description out of the name.
    expect(screen.getByText("Alpha").hasAttribute("slot")).toBe(false);
    expect(screen.getByText("First").hasAttribute("slot")).toBe(false);
  });

  it("draws a pressable row as HeroUI's ghost button that fills the row", () => {
    const onPress = vi.fn();
    render(
      <ul>
        <ListItem title="Alpha" onPress={onPress} />
      </ul>,
    );
    const button = screen.getByRole("button", { name: "Alpha" });
    expect(button.classList.contains("button--ghost")).toBe(true);
    expect(button.classList.contains("w-full")).toBe(true);
    act(() => button.click());
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("types: extends the contract, which needs a title", () => {
    expectTypeOf<ListItemProps>().toExtend<ListItemContractProps>();
    // @ts-expect-error a row needs its title
    render(<ListItem />);
  });
});
