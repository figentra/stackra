/**
 * Stackra file contract:
 * Purpose: `panelNavigationOf(panel, resources, documents, treeOf?)`, a panel's navigation read from its resources' and
 *          documents' `navigation`: grouped by the group label key, each entry with its title, path, icon, order,
 *          permission and, when it names a view, the badge's list read.
 * Boundary: pure apart from `treeOf` (the registered trees by default). A resource belongs to the panel when its tree's
 *           area is the panel's, and is listed when it declares an entry and has a List page; a document when its route
 *           names the panel and its class declares an entry. A badge needs the list query's ref and the named view among
 *           the resource's views; else the entry shows without one. Entries sort by order (none last) then key; groups
 *           by their first entry's order, then group key. Who may see an entry is the renderer's check.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 12 and 20); ADR 0214 (gate-filtered navigation); ADR 0164; the SDUI catalogue
 *                     case `resources` (navigation and badge), build-list item 53 (STA-1981).
 */
import { kindOf } from "@stackra/container";
import type { I18nKey } from "@stackra/i18n";

import { documentLabel } from "#core/functions/document-label.function";
import { resourceLabel } from "#core/functions/resource-label.function";
import { resourceTreeOf } from "#core/functions/resource-tree-of.function";
import { tableInput } from "#core/functions/table-input.function";
import type { DocumentOptions } from "#core/types/document-options.type";
import type { PanelDocumentPage } from "#core/types/panel-document-page.type";
import type { PanelNavigationEntry } from "#core/types/panel-navigation-entry.type";
import type { PanelNavigationGroup } from "#core/types/panel-navigation-group.type";
import type { PanelRef } from "#core/types/panel-ref.type";
import type { ResourceRoutes } from "#core/types/resource-routes.type";
import type { ResourceTree } from "#core/types/resource-tree.type";

/** An entry's order for sorting: entries without one come last. */
const rank = (entry: PanelNavigationEntry): number => entry.order ?? Number.POSITIVE_INFINITY;

/** Orders two entries by order, then key. */
const byOrder = (a: PanelNavigationEntry, b: PanelNavigationEntry): number =>
  rank(a) - rank(b) || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0);

/** The badge read of `tree`'s view `name`, when the resource can count it. */
function badgeOf(
  routes: ResourceRoutes,
  tree: Partial<ResourceTree>,
  name: string | undefined,
): PanelNavigationEntry["badge"] {
  const query = routes.operations.list;
  const view = tree.views?.find((each) => each.name === name);
  if (query === undefined || view === undefined) return undefined;
  const state = { search: "", filters: view.filter, sort: view.sort ?? null, limit: 1 };
  return { query, input: tableInput(tree.table, state, view.input) };
}

/**
 * The navigation of `panel` over `resources` and `documents`.
 *
 * @param treeOf - the recorded tree of a resource key; the registered trees by default.
 * @example
 * panelNavigationOf(Panels.Admin, resourceList, documents);
 * // [{ group: "orders::nav.sales", entries: [{ key: "orders.order", href: "/orders/orders", badge: {...} }] }]
 */
export function panelNavigationOf(
  panel: PanelRef,
  resources: readonly ResourceRoutes[],
  documents: readonly PanelDocumentPage[],
  treeOf: (key: string) => Partial<ResourceTree> = resourceTreeOf,
): readonly PanelNavigationGroup[] {
  const groups = new Map<I18nKey, PanelNavigationEntry[]>();
  const add = (group: I18nKey, entry: PanelNavigationEntry): void => {
    const entries = groups.get(group) ?? [];
    entries.push(entry);
    groups.set(group, entries);
  };

  for (const routes of resources) {
    const tree = treeOf(routes.key);
    const navigation = tree.options?.navigation;
    if (tree.options?.area !== panel.area || navigation === undefined) continue;
    if (routes.operations.list === undefined) continue;
    const badge = badgeOf(routes, tree, navigation.badge);
    add(navigation.group, {
      key: routes.key,
      label: resourceLabel(routes.key, "title"),
      href: routes.list.path,
      icon: navigation.icon,
      ...(navigation.order === undefined ? {} : { order: navigation.order }),
      ...(routes.permission === undefined ? {} : { permission: routes.permission }),
      ...(badge === undefined ? {} : { badge }),
    });
  }

  for (const { route, document } of documents) {
    const navigation = (kindOf(document)?.options as Partial<DocumentOptions> | undefined)
      ?.navigation;
    if (route.panel.key !== panel.key || navigation === undefined) continue;
    add(navigation.group, {
      key: route.key,
      label: documentLabel(route.key, "title"),
      href: route.path,
      icon: navigation.icon,
      ...(navigation.order === undefined ? {} : { order: navigation.order }),
      ...(route.permission === undefined ? {} : { permission: route.permission }),
    });
  }

  const sorted = [...groups].map(([group, entries]) => ({
    group,
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    entries: Object.freeze(entries.sort(byOrder)),
  }));
  return Object.freeze(
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    sorted.sort(
      (a, b) =>
        rank(a.entries[0] as PanelNavigationEntry) - rank(b.entries[0] as PanelNavigationEntry) ||
        (a.group < b.group ? -1 : a.group > b.group ? 1 : 0),
    ),
  );
}
