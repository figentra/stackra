/**
 * Stackra file contract:
 * Purpose: `UseInfiniteQueryResult<P>`, what `useInfiniteQuery` returns: the loaded pages (also as TanStack's `data`),
 *          the error, the loading flags, whether a next page exists, and the actions to load it or start over.
 * Boundary: a type only; `error` is always a `ClientError`.
 * Runtime: isomorphic
 * Governing contract: ADR 0079 (TanStack Query core); ADR 0140 (refusals).
 */
import type { InfiniteData } from "@tanstack/query-core";

import type { ClientError } from "#core/types/client-error.type";

/** The state of one paginated query on screen; `P` is a page. */
export interface UseInfiniteQueryResult<P> {
  /** The pages and their cursors, once a first page arrived. */
  readonly data: InfiniteData<P, string | undefined> | undefined;

  /** The loaded pages in order; empty before the first. */
  readonly pages: readonly P[];

  /** The error of the last fetch; `null` otherwise. */
  readonly error: ClientError | null;

  /** True until a first page or error exists. */
  readonly isPending: boolean;

  /** True while the first page loads with nothing cached. */
  readonly isLoading: boolean;

  /** True while any fetch runs, a next page or a refetch included. */
  readonly isFetching: boolean;

  /** True while the next page loads. */
  readonly isFetchingNextPage: boolean;

  /** Whether the last page names a next cursor. */
  readonly hasNextPage: boolean;

  /** Loads the next page; does nothing at the end. */
  readonly fetchNextPage: () => Promise<unknown>;

  /** Fetches every loaded page again. */
  readonly refetch: () => Promise<unknown>;
}
