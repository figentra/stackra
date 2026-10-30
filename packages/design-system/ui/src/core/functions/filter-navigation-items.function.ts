/**
 * Stackra file contract:
 * Purpose: `filterNavigationItems`, the places of a navigation tree whose label matches a filter: an entry stays when its
 *          own label matches (with all its children) or when one of its children does (with only those), so a group
 *          or a parent keeps the path to a match.
 * Boundary: pure; the match is `normalizeSearchText`'s, which ignores case, accents and Arabic letter forms. An empty
 *           filter returns the tree unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0303 (decision 7); owner request 2026-10-29 (STA-1371, sidebar filter).
 */
import type { NavigationItem } from "#contracts/types/navigation-item.type";
import { normalizeSearchText } from "#core/functions/normalize-search-text.function";

/** The entries of `items` that match `query`, with the parents and groups that lead to them. */
export function filterNavigationItems(
  items: readonly NavigationItem[],
  query: string,
): readonly NavigationItem[] {
  const needle = normalizeSearchText(query);
  if (needle === "") return items;
  const walk = (level: readonly NavigationItem[]): NavigationItem[] =>
    level.flatMap((item) => {
      if (normalizeSearchText(item.label).includes(needle)) return [item];
      const children = walk(item.children ?? []);
      return children.length === 0 ? [] : [{ ...item, children }];
    });
  return walk(items);
}
