/**
 * Stackra file contract:
 * Purpose: `resolveMenuItems(items, { value, href, isOn })`, a menu's entries ready to draw for one value, locale and
 *          flag state: route entries get their localised href and, without a label, their route's title; params and
 *          inputs built from the value; entries behind a flag that is off and groups left empty removed.
 * Boundary: internal to `useMenu`, `ContextMenu` and gen's desktop menus; reads the route table for titles and never
 *           runs an action.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 14 and 16); ADR 0297 (decision 4).
 */
import { kindOf } from "@stackra/container";
import type { FlagRef } from "@stackra/feature-flags";

import { ROUTE_TABLE } from "#core/constants/route-table.constant";
import { MenuItemKind } from "#core/enums/menu-item-kind.enum";
import type { HrefParams } from "#core/types/href-params.type";
import type { MenuItem } from "#core/types/menu-item.type";
import type { ResolvedMenuItem } from "#core/types/resolved-menu-item.type";
import type { RouteRef } from "#core/types/route-ref.type";

/** The title key of the route `ref` names, else its key. */
function titleOf(ref: RouteRef): string {
  const type = ROUTE_TABLE.get(ref.name);
  const title = type === undefined ? undefined : kindOf(type)?.options["title"];
  return typeof title === "string" ? title : ref.name;
}

/**
 * The drawable entries of `items`.
 *
 * @param resolve.value - the value a context menu is bound to.
 * @param resolve.href - resolves a route ref with its params to a localised href.
 * @param resolve.isOn - whether a flag is on for the viewer.
 * @example
 * resolveMenuItems(menu.items(createMenuBuilder()), { value: order, href, isOn: (flag) => reader.get(flag) });
 */
export function resolveMenuItems<V>(
  items: readonly MenuItem<V>[],
  resolve: {
    readonly value?: V | undefined;
    readonly href: (to: RouteRef, params?: HrefParams) => string;
    readonly isOn: (flag: FlagRef) => boolean;
  },
): readonly ResolvedMenuItem[] {
  const out: ResolvedMenuItem[] = [];
  for (const item of items) {
    switch (item.kind) {
      case MenuItemKind.Route: {
        if (item.flag !== undefined && !resolve.isOn(item.flag)) break;
        const params =
          typeof item.params === "function" ? item.params(resolve.value as V) : item.params;
        out.push({
          kind: item.kind,
          label: item.label ?? titleOf(item.to),
          to: resolve.href(item.to, params),
          end: item.end ?? false,
          ...(item.icon === undefined ? {} : { icon: item.icon }),
          ...(item.shortcut === undefined ? {} : { shortcut: item.shortcut }),
        });
        break;
      }
      case MenuItemKind.Link:
        out.push({
          kind: item.kind,
          label: item.label,
          href: item.url,
          external: item.external,
          ...(item.icon === undefined ? {} : { icon: item.icon }),
        });
        break;
      case MenuItemKind.Group: {
        const children = resolveMenuItems(item.items, resolve);
        if (children.length > 0) out.push({ kind: item.kind, label: item.label, items: children });
        break;
      }
      case MenuItemKind.Action:
        if (item.flag !== undefined && !resolve.isOn(item.flag)) break;
        out.push({
          kind: item.kind,
          label: item.label ?? item.action.key,
          action: item.action,
          input: item.input?.(resolve.value as V),
          destructive: item.destructive ?? false,
          ...(item.icon === undefined ? {} : { icon: item.icon }),
        });
        break;
      case MenuItemKind.Shortcut:
        out.push({ kind: item.kind, label: "", shortcut: item.shortcut });
        break;
      default:
        out.push({ kind: item.kind, label: "" });
    }
  }
  return out;
}
