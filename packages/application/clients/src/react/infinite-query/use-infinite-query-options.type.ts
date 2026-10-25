/**
 * Stackra file contract:
 * Purpose: `UseInfiniteQueryOptions<P>`, the third argument of `useInfiniteQuery`: how to read the next cursor from a
 *          page, whether it runs and whether it refetches on focus.
 * Boundary: a type only. Without `getNextCursor` a page's `nextCursor` is used while its `hasMore` is true, which is the
 *           shape of every `Page.of(...)` output.
 * Runtime: browser, react-native
 * Governing contract: ADR 0079 (TanStack Query core); the HTTP conventions rule (cursor pagination).
 */

/** Options of one `useInfiniteQuery`; `P` is a page. */
export interface UseInfiniteQueryOptions<P> {
  /** The cursor of the page after `page`, or `undefined` at the end. */
  readonly getNextCursor?: (page: P) => string | undefined;

  /** Runs the query only while true. */
  readonly enabled?: boolean;

  /** Refetches the loaded pages when the window or the app regains focus. */
  readonly refetchOnFocus?: boolean;
}
