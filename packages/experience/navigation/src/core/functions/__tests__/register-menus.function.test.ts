/**
 * Stackra file contract:
 * Purpose: unit tests of `registerMenus`: it registers menu classes by key and its disposer takes back exactly those;
 *          a key that is not snake_case or a class that is not a menu registers none of the batch.
 * Boundary: test only; clears the registry after each case.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0111 (decision 3); STA-1947.
 */
import { afterEach, describe, expect, it } from "vitest";

import { Menu } from "#core/bases/menu.base";
import { Route } from "#core/bases/route.base";
import { MENU_REGISTRY } from "#core/constants/menu-registry.constant";
import { MenuKind } from "#core/enums/menu-kind.enum";
import { registerMenus } from "#core/functions/register-menus.function";
import type { MenuClass } from "#core/types/menu-class.type";

class MainMenu extends Menu({ kind: MenuKind.Navigation }) {}
class RowMenu extends Menu({ kind: MenuKind.Context }) {}
class HomeRoute extends Route({ path: "/" }) {}

afterEach(() => MENU_REGISTRY.clear());

describe("registerMenus", () => {
  it("registers each menu by key, and its disposer takes back exactly those", () => {
    const dispose = registerMenus({ loyalty_kit_main: MainMenu, loyalty_kit_row: RowMenu });
    expect([...MENU_REGISTRY]).toEqual([
      ["loyalty_kit_main", MainMenu],
      ["loyalty_kit_row", RowMenu],
    ]);
    registerMenus({ loyalty_kit_row: MainMenu });
    dispose();
    expect([...MENU_REGISTRY]).toEqual([["loyalty_kit_row", MainMenu]]);
  });

  it("registers nothing when a key or a class is wrong", () => {
    expect(() => registerMenus({ main: MainMenu, "loyalty.main": RowMenu })).toThrow(RangeError);
    expect(() =>
      registerMenus({ main: MainMenu, home: HomeRoute as unknown as MenuClass }),
    ).toThrow(TypeError);
    expect(MENU_REGISTRY.size).toBe(0);
  });
});
