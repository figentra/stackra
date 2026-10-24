/**
 * Stackra file contract:
 * Purpose: `SearchPageOptions<M>`, what `search.in(Model).page(phrase, options)` takes: the find options plus the
 *          cursor an earlier page returned.
 * Boundary: a type only. The cursor is opaque to callers; a cursor no page gave is refused `search_cursor_invalid`.
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decision 1); cursor pagination in the HTTP conventions.
 */
import type { SearchFindOptions } from "#core/types/search-find-options.type";

/** The options of one page of a ranked read. */
export interface SearchPageOptions<M extends object> extends SearchFindOptions<M> {
  /** The `nextCursor` of the page before; absent for the first page. */
  readonly cursor?: string | undefined;
}
