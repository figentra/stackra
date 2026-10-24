/**
 * Stackra file contract:
 * Purpose: proves the Menu and ActionMenu contracts compose from the shared overlay contracts (the open state and the
 *          placement, no dismissal props), type an action's tone as `default` or `danger`, give a submenu entry
 *          sub-actions that cannot nest further, scope a section by a required title that can be hidden, and keep a
 *          menu's selection a list of keys.
 * Boundary: type assertions only; they are checked by the typechecker and the test passes at run time.
 * Runtime: node
 * Governing contract: ADR 0312; ADR 0022 (test placement).
 */
// @covers sta-350:FR-106
import type { ActionMenuContractProps } from "#contracts/types/action-menu-contract-props.type";
import type { MenuContractProps } from "#contracts/types/menu-contract-props.type";
import type { MenuItem } from "#contracts/types/menu-item.type";
import type { MenuLeafItem } from "#contracts/types/menu-leaf-item.type";
import type { MenuSection } from "#contracts/types/menu-section.type";
import type { OpenStateContractProps } from "#contracts/types/open-state-contract-props.type";
import type { PlacementContractProps } from "#contracts/types/placement-contract-props.type";

describe("menu contracts", () => {
  it("builds a Menu and an ActionMenu on the open state and the placement, and on no dismissal props", () => {
    expectTypeOf<MenuContractProps>().toExtend<OpenStateContractProps>();
    expectTypeOf<MenuContractProps>().toExtend<PlacementContractProps>();
    expectTypeOf<ActionMenuContractProps>().toExtend<OpenStateContractProps>();
    expectTypeOf<ActionMenuContractProps>().toExtend<PlacementContractProps>();
    // A menu dismisses itself, so it does not take the dismissal props.
    expectTypeOf<MenuContractProps>().not.toHaveProperty("isDismissable");
    expectTypeOf<MenuContractProps>().not.toHaveProperty("isKeyboardDismissDisabled");
  });

  it("types an action's tone as default or danger", () => {
    expectTypeOf<MenuLeafItem["tone"]>().toEqualTypeOf<"default" | "danger" | undefined>();
  });

  it("lets a submenu hold actions that cannot open a further submenu", () => {
    expectTypeOf<MenuItem["items"]>().toEqualTypeOf<readonly MenuLeafItem[] | undefined>();
    expectTypeOf<MenuLeafItem>().not.toHaveProperty("items");
  });

  it("names every section, and a title can be hidden from sight", () => {
    expectTypeOf<MenuSection["title"]>().toEqualTypeOf<string>();
    expectTypeOf<MenuSection["isTitleHidden"]>().toEqualTypeOf<boolean | undefined>();
  });

  it("keeps a menu's selection as a list of keys and gives the ActionMenu none", () => {
    expectTypeOf<MenuContractProps["value"]>().toEqualTypeOf<readonly string[] | undefined>();
    expectTypeOf<MenuContractProps["onChange"]>().toEqualTypeOf<
      ((value: readonly string[]) => void) | undefined
    >();
    expectTypeOf<ActionMenuContractProps>().not.toHaveProperty("selectionMode");
  });
});
