/**
 * Stackra file contract:
 * Purpose: `useMenuFrom(resolve, MenuClass, value?)`, the entries of one menu through a given resolver, memoised: the
 *          body the web and native `useMenu` share; each passes its own `useMenuResolver()`.
 * Boundary: internal; platform-free, so the native entry imports it.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 14, 15 and 16).
 */
import type { AnyClass } from "@stackra/container";
import { useMemo } from "react";

import type { MenuEntries } from "#core/types/menu-entries.type";
import type { MenuResolver } from "#core/types/menu-resolver.type";
import type { RunnableMenu } from "#core/types/runnable-menu.type";

/**
 * The drawable entries of `type`, resolved by `resolve`.
 *
 * @param resolve - the entry's menu resolver.
 * @param type - the menu class.
 * @param value - the value a context menu is bound to.
 * @example
 * items = useMenuFrom(useMenuResolver(), SiteMenu);
 */
export function useMenuFrom<M extends RunnableMenu<V>, V = unknown>(
  resolve: MenuResolver,
  type: AnyClass<M>,
  value?: V,
): MenuEntries<M, V> {
  return useMemo(() => resolve<V>(type, value) as MenuEntries<M, V>, [resolve, type, value]);
}
