/**
 * Stackra file contract:
 * Purpose: `useMenus(kind?)`, the menus the app registered (its own and its packages', through the generated route
 *          table), optionally only those of one `MenuKind`, so a sidebar or tab bar draws every module's menu without
 *          naming its class; each one's entries come from `useMenu(menu)`.
 * Boundary: reads `MENU_REGISTRY` once per render pass; registration happens when the route table loads, before the
 *           app renders, so the registry does not change under a mounted shell.
 * Runtime: isomorphic (platform-free: the native entry imports it too)
 * Governing contract: ADR 0111 (decisions 1 and 3); STA-1947.
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
