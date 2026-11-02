/**
 * Stackra file contract:
 * Purpose: unit tests of `useMenus`: it lists every registered menu by key, or only those of one `MenuKind`.
 * Boundary: test only; registers menus through `registerMenus` and clears the registry after each case.
 * Runtime: browser (vitest, jsdom)
 * Governing contract: ADR 0022 (test placement); ADR 0111 (decision 3); STA-1947.
 */
// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Menu } from "#core/bases/menu.base";
import { MENU_REGISTRY } from "#core/constants/menu-registry.constant";
import { MenuKind } from "#core/enums/menu-kind.enum";
import { registerMenus } from "#core/functions/register-menus.function";
import { useMenus } from "#react/menu/use-menus";

class MainMenu extends Menu({ kind: MenuKind.Navigation }) {}
class RowMenu extends Menu({ kind: MenuKind.Context }) {}

afterEach(() => MENU_REGISTRY.clear());

describe("useMenus", () => {
  it("lists the registered menus, all or of one kind", () => {
    registerMenus({ loyalty_kit_main: MainMenu, loyalty_kit_row: RowMenu });
    expect(renderHook(() => useMenus()).result.current).toEqual([
      { key: "loyalty_kit_main", menu: MainMenu },
      { key: "loyalty_kit_row", menu: RowMenu },
    ]);
    expect(renderHook(() => useMenus(MenuKind.Navigation)).result.current).toEqual([
      { key: "loyalty_kit_main", menu: MainMenu },
    ]);
  });
});
