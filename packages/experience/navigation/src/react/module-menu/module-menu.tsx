/**
 * Stackra file contract:
 * Purpose: the web `ModuleMenu`: the console's side navigation drawn from every module's declared navigation menu
 *          (`Menu({ kind: MenuKind.Navigation })`, collected by gen into the menu registry), in registry order: each
 *          route entry is a place with its href in the visitor's locale mount, the one under the current path marked
 *          current, groups are labelled headings, labels are the menus' catalogue keys translated.
 * Boundary: composition of `@stackra/ui`'s Sidebar (which draws the places as its NavigationList-shaped menu) over
 *           `useMenus` and the web menu resolver; every Sidebar prop passes through. `items` replaces the declared
 *           menus and is drawn as given. Entries behind a flag that is off are already gone; action and shortcut
 *           entries are left out. Needs a router, a container and an `I18nProvider` above it, as `NavLink` does.
 * Runtime: browser
 * Governing contract: ADR 0111 (decisions 1 and 3); ADR 0317 (decisions 1, 3 and 4); ADR 0297 (decision 4); ADR 0504
 *          (module UI kits).
 */
import type { AnyClass } from "@stackra/container";
import type { I18nKey } from "@stackra/i18n";
import { useTranslation } from "@stackra/i18n/react";
import { Sidebar } from "@stackra/ui/react";
import { useMemo, type ReactElement } from "react";
import { useLocation } from "react-router";

import { MenuKind } from "#core/enums/menu-kind.enum";
import { navigationItemsOf } from "#core/functions/navigation-items-of.function";
import type { RunnableMenu } from "#core/types/runnable-menu.type";
import { useMenuResolver } from "#react/menu/use-menu-resolver";
import { useMenus } from "#react/menu/use-menus";
import type { ModuleMenuProps } from "#react/module-menu/module-menu.props";

/** `path` without its query, fragment and trailing slash, the root kept. */
const pathOf = (href: string): string => (href.split(/[?#]/)[0] ?? href).replace(/(?<=.)\/+$/, "");

/**
 * The declared module menus as the Sidebar.
 *
 * @example
 * <ModuleMenu label="Main navigation" startContent={<Brand />} endContent={<AccountMenu labels={labels} />} />
 */
export function ModuleMenu({ items, ...rest }: ModuleMenuProps): ReactElement {
  const menus = useMenus(MenuKind.Navigation);
  const resolve = useMenuResolver();
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const declared = useMemo(() => {
    if (items !== undefined) return items;
    const current = pathOf(pathname);
    const isCurrent = (href: string, end: boolean) => {
      const path = pathOf(href);
      return current === path || (!end && path !== "/" && current.startsWith(`${path}/`));
    };
    return menus.flatMap(({ key, menu }) =>
      navigationItemsOf(
        // A registered menu class always has `items(m)`; `MenuClass` only names the kind base.
        resolve(menu as unknown as AnyClass<RunnableMenu>),
        { label: (label) => t(label as I18nKey), isCurrent },
        key,
      ),
    );
  }, [items, menus, resolve, t, pathname]);
  return <Sidebar {...rest} items={declared} />;
}
