/**
 * Stackra file contract:
 * Purpose: `matchPages`, the review area's search rule, shared by the landing's header search and the Search tab: the
 *          pages whose title, category or tier contains every word of the query, ignoring case (the web palette's rule).
 * Boundary: a pure function over the page links; it reads no navigation state.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6, the review area).
 */
import type { PageLink } from "#src/types/page-link.type";

/** The pages whose title, category or tier contains every word of `query`, ignoring case, in their given order. */
export function matchPages(pages: readonly PageLink[], query: string): PageLink[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return pages.filter((page) => {
    const text = `${page.title} ${page.category} ${page.tier}`.toLowerCase();
    return words.every((word) => text.includes(word));
  });
}
