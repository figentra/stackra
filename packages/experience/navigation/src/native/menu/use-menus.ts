/**
 * Stackra file contract:
 * Purpose: `useMenus(kind?)` on native, at parity with the web hook: the menus the app registered (its own and its
 *          packages', through the generated route table), optionally only those of one `MenuKind`, so a screen draws
 *          every module's menu without naming its class; each one's entries come from `useMenu(menu)`.
 * Boundary: reads `MENU_REGISTRY` once per render pass; registration happens when the route table loads, before the
 *           app renders. The web entry has its own copy, because entries import `.` only, never each other.
 * Runtime: react-native
 * Governing contract: ADR 0111 (decisions 1 and 3); ADR 0294 (decision 15); STA-1947.
 */
import { kindOf } from "@stackra/container";
import { useMemo } from "react";

import { MENU_REGISTRY } from "#core/constants/menu-registry.constant";
import type { MenuKind } from "#core/enums/menu-kind.enum";
import type { MenuClass } from "#core/types/menu-class.type";

/**
 * The registered menus, by key, of `kind` when given.
 *
 * @example
 * const menus = useMenus(MenuKind.Navigation); // [{ key: "loyalty_kit_main", menu: MainMenu }]
 */
export function useMenus(
  kind?: MenuKind,
): readonly { readonly key: string; readonly menu: MenuClass }[] {
  return useMemo(
    () =>
      [...MENU_REGISTRY]
        .filter(([, menu]) => kind === undefined || kindOf(menu)?.options["kind"] === kind)
        .map(([key, menu]) => ({ key, menu })),
    [kind],
  );
}
