/**
 * Stackra file contract:
 * Purpose: `useNavigation()`: with no argument, the router's navigation state (`state === "submitting"` while a form
 *          posts); with the generated tree (`useNavigation(Navigation)`), its groups ready to draw, each entry with its
 *          localised `href` and `isCurrent`; entries the actor may not reach (the entry's `permission`, else its
 *          target's: a resource's `permission`, a route's `permission` option) or behind a flag that is off, and
 *          groups left empty, removed.
 * Boundary: one hook for both, so it calls the same hooks either way. The permission check is `@stackra/iam`'s held
 *           snapshot; entitlement and module-install gating (ADR 0214) are not read here yet, and the server refuses
 *           what the viewer may not reach either way.
 * Runtime: browser
 * Governing contract: ADR 0214 (gate-filtered navigation); ADR 0164 (panel shell); ADR 0297 (decision 4).
 */
import { kindOf } from "@stackra/container";
import { useMemo } from "react";
import { useLocation, useNavigation as useRouterNavigation, type Navigation } from "react-router";

import { ROUTE_TABLE } from "#core/constants/route-table.constant";
import type { NavigationItem } from "#core/types/navigation-item.type";
import type { NavigationTree } from "#core/types/navigation-tree.type";
import type { ResolvedNavigationGroup } from "#core/types/resolved-navigation-group.type";
import { useFlagCheck } from "#react/flags/use-flag-check";
import { useHrefResolver } from "#react/href/use-href-resolver";
import { usePermissionCheck } from "#react/permissions/use-permission-check";

/** The permission an entry needs: its own, else its target's (a resource's field, a route's option). */
function permissionOf(item: NavigationItem): string | undefined {
  if (item.permission !== undefined) return item.permission;
  const target = item.to;
  if (typeof target !== "object") return undefined;
  if ("permission" in target && typeof target.permission === "string") return target.permission;
  if (!("name" in target)) return undefined;
  const type = ROUTE_TABLE.get(target.name);
  const permission = type === undefined ? undefined : kindOf(type)?.options["permission"];
  return typeof permission === "string" ? permission : undefined;
}

/** `path` without a trailing slash, the root kept. */
const trimmed = (path: string): string => path.replace(/(?<=.)\/+$/, "");

/**
 * The router's navigation state.
 *
 * @example
 * navigation = useNavigation();
 * <Button isPending={this.navigation.state === "submitting"}>
 */
export function useNavigation(): Navigation;

/**
 * The generated navigation tree, ready to draw for the viewer.
 *
 * @example
 * groups = useNavigation(Navigation);
 */
export function useNavigation(tree: NavigationTree): readonly ResolvedNavigationGroup[];

/** Implementation of both forms. */
export function useNavigation(
  tree?: NavigationTree,
): Navigation | readonly ResolvedNavigationGroup[] {
  const state = useRouterNavigation();
  const { pathname } = useLocation();
  const href = useHrefResolver();
  const isOn = useFlagCheck();
  const can = usePermissionCheck();
  const groups = useMemo(() => {
    if (tree === undefined) return null;
    const current = trimmed(pathname);
    return tree.groups.flatMap((group): ResolvedNavigationGroup[] => {
      const items = group.items
        .filter((item) => item.flag === undefined || isOn(item.flag))
        .filter((item) => {
          const permission = permissionOf(item);
          return permission === undefined || can(permission);
        })
        .map((item) => {
          const target = href(item.to);
          const path = trimmed(target.split(/[?#]/)[0] ?? target);
          return {
            label: item.label,
            href: target,
            isCurrent: current === path || (path !== "/" && current.startsWith(`${path}/`)),
            ...(item.icon === undefined ? {} : { icon: item.icon }),
          };
        });
      return items.length === 0 ? [] : [{ group: group.group, items }];
    });
  }, [tree, pathname, href, isOn, can]);
  return groups ?? state;
}
