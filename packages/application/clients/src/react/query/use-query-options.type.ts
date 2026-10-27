/**
 * Stackra file contract:
 * Purpose: `UseQueryOptions`, the third argument of `useQuery`: whether it runs, whether it refetches when the screen
 *          regains focus, and whether the previous answer stays while a new input loads.
 * Boundary: a type only; anything unset follows `QueryConfig`.
 * Runtime: isomorphic
 * Governing contract: ADR 0079 (TanStack Query core).
 */

/** Options of one `useQuery`. */
export interface UseQueryOptions {
  /** Runs the query only while true (a search shorter than its minimum). */
  readonly enabled?: boolean;

  /** Refetches a stale answer when the window or the app regains focus. */
  readonly refetchOnFocus?: boolean;

  /** Keeps the previous input's answer on screen while the new one loads (a search box). */
  readonly keepPreviousData?: boolean;
}
