/**
 * Stackra file contract:
 * Purpose: `useInfiniteQuery`, a cursor-paginated consumed query in a component: each page is the query called with
 *          the input plus the previous page's cursor, all pages cached together under the query's key.
 * Boundary: TanStack Query core's infinite observer under `useSyncExternalStore`. The first page is fetched without a
 *           cursor; the next cursor comes from `getNextCursor`, else the page's `nextCursor` while `hasMore` is true.
 *           Live like `useQuery` when the query declares `invalidateOn`.
 * Runtime: browser, react-native
 * Governing contract: ADR 0079 (TanStack Query core); the HTTP conventions rule (cursor pagination); owner decision R-25.
 */
import { InfiniteQueryObserver, notifyManager } from "@tanstack/query-core";
import type { InfiniteData, InfiniteQueryObserverOptions, QueryKey } from "@tanstack/query-core";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

import { clientRequest } from "#core/functions/client-request.function";
import { queryKeyOf } from "#core/functions/query-key-of.function";
import type { ClientError } from "#core/types/client-error.type";
import type { QueryRef } from "#core/types/query-ref.type";
import type { RefInput } from "#core/types/ref-input.type";
import type { RefOutput } from "#core/types/ref-output.type";
import type { UseInfiniteQueryOptions } from "#react/infinite-query/use-infinite-query-options.type";
import type { UseInfiniteQueryResult } from "#react/infinite-query/use-infinite-query-result.type";
import { useClientRuntime } from "#react/runtime/use-client-runtime";

/** A `Page.of(...)` page's next cursor: `nextCursor` while `hasMore` is true. */
function nextCursorOf(page: unknown): string | undefined {
  if (typeof page !== "object" || page === null) return undefined;
  const { hasMore, nextCursor } = page as {
    readonly hasMore?: unknown;
    readonly nextCursor?: unknown;
  };
  return hasMore === true && typeof nextCursor === "string" ? nextCursor : undefined;
}

/**
 * The pages of `query` for `input`.
 *
 * @throws Error outside a `ContainerProvider` whose container binds `ClientTransport` and `ServerStateCache`.
 * @example
 * const inbox = useInfiniteQuery(ListInboxMessagesQuery, { limit: 20 });
 * const entries = inbox.pages.flatMap((page) => page.items);
 */
export function useInfiniteQuery<Q extends QueryRef>(
  query: Q,
  input: RefInput<Q>,
  options: UseInfiniteQueryOptions<RefOutput<Q>> = {},
): UseInfiniteQueryResult<RefOutput<Q>> {
  const { transport, cache } = useClientRuntime();
  const getNextCursor = options.getNextCursor ?? nextCursorOf;
  const observerOptions: InfiniteQueryObserverOptions<
    RefOutput<Q>,
    ClientError,
    InfiniteData<RefOutput<Q>, string | undefined>,
    QueryKey,
    string | undefined
  > = {
    queryKey: [...queryKeyOf(query, input), "pages"],
    // The transport decodes each page with the query's output schema.
    queryFn: ({ pageParam, signal }) =>
      transport.send(
        clientRequest(
          query,
          pageParam === undefined ? input : { ...(input as object), cursor: pageParam },
          { signal },
        ),
      ) as Promise<RefOutput<Q>>,
    initialPageParam: undefined,
    getNextPageParam: (page) => getNextCursor(page),
    enabled: options.enabled ?? true,
    ...(options.refetchOnFocus === undefined
      ? {}
      : { refetchOnWindowFocus: options.refetchOnFocus }),
  };
  const [observer] = useState(() => new InfiniteQueryObserver(cache.client, observerOptions));
  useEffect(() => {
    observer.setOptions(observerOptions);
  });
  useEffect(() => cache.watch(query), [cache, query]);
  const result = useSyncExternalStore(
    useCallback(
      (onChange: () => void) => observer.subscribe(notifyManager.batchCalls(onChange)),
      [observer],
    ),
    () => observer.getCurrentResult(),
    () => observer.getCurrentResult(),
  );
  return {
    data: result.data,
    pages: result.data?.pages ?? [],
    error: result.error,
    isPending: result.isPending,
    isLoading: result.isLoading,
    isFetching: result.isFetching,
    isFetchingNextPage: result.isFetchingNextPage,
    hasNextPage: result.hasNextPage,
    fetchNextPage: () => observer.fetchNextPage(),
    refetch: () => observer.refetch(),
  };
}
