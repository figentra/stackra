/**
 * Stackra file contract:
 * Purpose: `tabs(items)`, an app's tabs in `#stackra/navigation`: the routes that declare `tab`, sorted by `order`, each
 *          labelled with its route's title.
 * Boundary: builds frozen data and checks it. Gen writes the call, not authors.
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decision 12: tab items from routes).
 */
import type { TabItem } from "#core/types/tab-item.type";

/**
 * The tabs, in order.
 *
 * @throws RangeError when an order is not a whole number from 1, or two tabs share an order or a route.
 * @example
 * export const Tabs = tabs([{ route: Routes.dashboard, order: 1, icon: "house", label: I18n.pages.dashboard.title }]);
 */
export function tabs(items: readonly TabItem[]): readonly TabItem[] {
  for (const item of items)
    if (!Number.isInteger(item.order) || item.order < 1)
      throw new RangeError(`A tab order is a whole number from 1, not ${String(item.order)}`);
  if (new Set(items.map((item) => item.order)).size !== items.length)
    throw new RangeError("Two tabs share an order");
  if (new Set(items.map((item) => item.route.name)).size !== items.length)
    throw new RangeError("A route is a tab once");
  return Object.freeze(
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    [...items].sort((a, b) => a.order - b.order).map((item) => Object.freeze({ ...item })),
  );
}
