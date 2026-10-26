/**
 * Stackra file contract:
 * Purpose: proves the web ContextMenu maps `isOpen` to HeroUI Pro's `open`, names its menu from `label`, passes
 *          unknown props through, carries HeroUI Pro's own parts, and refuses HeroUI Pro's `open` and `aria-label`.
 * Boundary: jsdom with real HeroUI Pro and React Aria; the theme CSS is not loaded, so roles and names are checked,
 *          not looks.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-004
import { ContextMenu as HeroContextMenu } from "@heroui-pro/react/context-menu";
import { render, screen } from "@testing-library/react";

import { ContextMenu } from "#react/context-menu/context-menu";
import type { ContextMenuProps } from "#react/context-menu/context-menu.props";

/** A context menu with one item, the open state left to the caller. */
function Example(props: Partial<ContextMenuProps> & { readonly label?: string }) {
  const { label = "Actions", ...rest } = props;
  return (
    <ContextMenu {...rest}>
      <ContextMenu.Trigger data-testid="area">Right click here</ContextMenu.Trigger>
      <ContextMenu.Popover>
        <ContextMenu.Menu label={label} data-testid="menu">
          <ContextMenu.Item id="copy">Copy</ContextMenu.Item>
          <ContextMenu.Separator />
          <ContextMenu.Item id="paste">Paste</ContextMenu.Item>
        </ContextMenu.Menu>
      </ContextMenu.Popover>
    </ContextMenu>
  );
}

describe("ContextMenu (web)", () => {
  it("names the menu from label and draws its items", () => {
    render(<Example defaultOpen />);
    // The attribute, not the computed name: React Aria also points `aria-labelledby` at the (absent) trigger button.
    expect(screen.getByRole("menu").getAttribute("aria-label")).toBe("Actions");
    expect(screen.getAllByRole("menuitem").map((item) => item.textContent)).toEqual([
      "Copy",
      "Paste",
    ]);
  });

  it("maps isOpen to HeroUI Pro's open, in both directions", () => {
    const { rerender } = render(<Example isOpen />);
    expect(screen.queryByRole("menu")).not.toBeNull();
    rerender(<Example isOpen={false} />);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("stays closed until opened when isOpen is left out", () => {
    render(<Example />);
    expect(screen.queryByRole("menu")).toBeNull();
    expect(screen.getByTestId("area").textContent).toBe("Right click here");
  });

  it("passes unknown props through to the menu and the trigger", () => {
    render(<Example defaultOpen />);
    expect(screen.getByTestId("menu").getAttribute("role")).toBe("menu");
    expect(screen.getByTestId("area").textContent).toBe("Right click here");
  });

  it("carries HeroUI Pro's own parts", () => {
    for (const part of [
      "Trigger",
      "Popover",
      "Item",
      "ItemIndicator",
      "Section",
      "Separator",
      "SubmenuTrigger",
      "SubmenuIndicator",
    ] as const) {
      expect(ContextMenu[part]).toBe(HeroContextMenu[part]);
    }
  });

  it("refuses HeroUI Pro's names for the open state and the accessible name", () => {
    expectTypeOf<ContextMenuProps>().toHaveProperty("isOpen");
    // @ts-expect-error `isOpen` is the one name for the controlled open state
    void (<ContextMenu open>x</ContextMenu>);
    // @ts-expect-error `label` is the one name for the accessible name
    void (<ContextMenu.Menu aria-label="x">{[]}</ContextMenu.Menu>);
    // @ts-expect-error `label` is required: a menu has no accessible name of its own
    void (<ContextMenu.Menu>{[]}</ContextMenu.Menu>);
  });
});
