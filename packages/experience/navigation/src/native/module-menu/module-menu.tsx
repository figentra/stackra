/**
 * Stackra file contract:
 * Purpose: the native `ModuleMenu`: every module's declared navigation menu (`Menu({ kind: MenuKind.Navigation })`,
 *          collected by gen into the menu registry), in registry order, as `@stackra/ui`'s NavigationList, the same
 *          places the web ModuleMenu shows in the Sidebar: a route entry is a row that opens its app path through the
 *          nearest `RouterProvider` (`ReactNavigationProvider` binds it to React Navigation's linking config), a link
 *          opens its URL, a group is a heading over its rows, labels are the menus' catalogue keys translated.
 * Boundary: composition of the native NavigationList over the native `useMenus` and menu resolver; its props pass
 *           through. `items` replaces the declared menus and is drawn as given, `isCurrent` included: React
 *           Navigation names screens, not paths, so the declared places carry no current mark here. Entries behind a
 *           flag that is off are already gone; action and shortcut entries are left out. A phone's main navigation is
 *           the generated tab bar, so this list is for a "more" screen, a drawer or an iPad side column. Needs a
 *           container and an `I18nProvider` above it.
 * Runtime: react-native
 * Governing contract: ADR 0111 (decisions 1 and 3); ADR 0317 (decisions 1, 2, 3 and 7); ADR 0504 (module UI kits).
 */
import type { AnyClass } from "@stackra/container";
import type { I18nKey } from "@stackra/i18n";
import { useTranslation } from "@stackra/i18n/react";
import { NavigationList } from "@stackra/ui/native";
import { useMemo, type ReactElement } from "react";

import { MenuKind } from "#core/enums/menu-kind.enum";
import { navigationItemsOf } from "#core/functions/navigation-items-of.function";
import type { RunnableMenu } from "#core/types/runnable-menu.type";
import { useMenuResolver } from "#native/menu/use-menu-resolver";
import { useMenus } from "#react/menu/use-menus";
import type { ModuleMenuProps } from "#native/module-menu/module-menu.props";

/**
 * The declared module menus as pressable rows.
 *
 * @example
 * <ModuleMenu label="Main navigation" />
 */
export function ModuleMenu({ items, ...rest }: ModuleMenuProps): ReactElement {
  const menus = useMenus(MenuKind.Navigation);
  const resolve = useMenuResolver();
  const { t } = useTranslation();
  const declared = useMemo(
    () =>
      items ??
      menus.flatMap(({ key, menu }) =>
        navigationItemsOf(
          // A registered menu class always has `items(m)`; `MenuClass` only names the kind base.
          resolve(menu as unknown as AnyClass<RunnableMenu>),
          { label: (label) => t(label as I18nKey) },
          key,
        ),
      ),
    [items, menus, resolve, t],
  );
  return <NavigationList {...rest} items={declared} />;
}
