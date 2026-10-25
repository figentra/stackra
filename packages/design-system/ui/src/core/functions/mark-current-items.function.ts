/**
 * Stackra file contract:
 * Purpose: flags the navigation entry the user is on, from the path of the current route, so an app that uses no
 *          `@stackra/navigation` still declares `isCurrent` once and web and native agree. An entry matches when its
 *          `href` is the path or a whole-segment prefix of it (`/orders` is current on `/orders/ord_1` and not on
 *          `/orders-archive`); the longest match wins, so `/orders` loses to `/orders/new` on `/orders/new`.
 * Boundary: pure function over the item tree; no React, no router. It returns a new tree and never mutates the one it
 *           is given. An absolute URL never matches, and `/` matches only itself.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: the same output on web and native); ADR 0317 (decision 3).
 */
import type { NavigationItem } from "#contracts/types/navigation-item.type";

/** The path without a query, a fragment or a trailing slash (the root stays `/`); empty for an absolute URL. */
function pathOf(href: string): string {
  const path = href.split(/[?#]/u, 1)[0] ?? "";
  if (!path.startsWith("/")) return "";
  return path.length > 1 ? path.replace(/\/+$/u, "") || "/" : path;
}

/** How long a match the entry's href is of the pathname: its path length, or -1 for no match. */
function matchLength(href: string | undefined, pathname: string): number {
  const path = href === undefined ? "" : pathOf(href);
  if (path === "") return -1;
  if (path === pathname) return path.length;
  if (path === "/") return -1;
  return pathname.startsWith(`${path}/`) ? path.length : -1;
}

/** The longest match among the items and everything nested under them, or -1 when none matches. */
function longestMatch(items: readonly NavigationItem[], pathname: string): number {
  return items.reduce(
    (best, item) =>
      Math.max(best, matchLength(item.href, pathname), longestMatch(item.children ?? [], pathname)),
    -1,
  );
}

/** Copies the tree, flagging the entries whose match is the longest one found. */
function mark(
  items: readonly NavigationItem[],
  pathname: string,
  best: number,
): readonly NavigationItem[] {
  return items.map((item) => ({
    ...item,
    isCurrent: best >= 0 && matchLength(item.href, pathname) === best,
    children: item.children === undefined ? undefined : mark(item.children, pathname, best),
  }));
}

/**
 * Returns the items with `isCurrent` set on the entry that best matches the pathname, and cleared on the rest.
 * @param items - the navigation entries, with their nested `children`
 * @param pathname - the path of the current route, for example `/orders/ord_1`
 * @returns a new tree; no entry is current when none matches
 */
export function markCurrentItems(
  items: readonly NavigationItem[],
  pathname: string,
): readonly NavigationItem[] {
  const current = pathOf(pathname);
  return mark(items, current, current === "" ? -1 : longestMatch(items, current));
}
