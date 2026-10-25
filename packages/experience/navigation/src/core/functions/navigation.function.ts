/**
 * Stackra file contract:
 * Purpose: `navigation(panel, groups)`, the generated navigation tree of a panel in `#stackra/navigation`: its groups of
 *          entries in declared order, each with a label key, a target and an icon.
 * Boundary: builds frozen data and checks it; `useNavigation(tree)` resolves it for the viewer. Gen writes the call,
 *           not authors.
 * Runtime: isomorphic
 * Governing contract: ADR 0214 (gate-filtered navigation); ADR 0164 (panel shell); ADR 0307.
 */
import type { AnyClass } from "@stackra/container";

import type { NavigationGroup } from "#core/types/navigation-group.type";
import type { NavigationTree } from "#core/types/navigation-tree.type";

/**
 * The navigation of `panel`.
 *
 * @throws RangeError when a group or an entry has an empty label.
 * @example
 * export const Navigation = navigation(Panels.TenantAdmin, [
 *   { group: I18n.catalogue.nav.catalogue, items: [{ label, to: Resources.Product, icon: "package" }] },
 * ]);
 */
export function navigation(panel: AnyClass, groups: readonly NavigationGroup[]): NavigationTree {
  for (const group of groups) {
    if (group.group === "") throw new RangeError("A navigation group needs a label");
    for (const item of group.items)
      if (item.label === "")
        throw new RangeError(`An entry of the group "${group.group}" needs a label`);
  }
  return Object.freeze({
    panel,
    groups: Object.freeze(
      groups.map((group) =>
        Object.freeze({
          group: group.group,
          items: Object.freeze(group.items.map((item) => Object.freeze({ ...item }))),
        }),
      ),
    ),
  });
}
