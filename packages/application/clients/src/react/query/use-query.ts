/**
 * Stackra file contract:
 * Purpose: `useQuery`, a consumed query's answer in a component: cached by `[Query.key, input]` in the server-state
 *          cache, fetched through the client transport, refetched on focus per config, and kept live when the query
 *          declares `invalidateOn`.
 * Boundary: TanStack Query core's observer under `useSyncExternalStore`; no `@tanstack/react-query`. The input is
 *           validated when the fetch runs, so a disabled query may hold an input that would be refused. Live queries
 *           share one subscription per query through `ServerStateCache.watch`.
 * Runtime: isomorphic
 * Governing contract: ADR 0079 (TanStack Query core); ADR 0260 (decision 4); owner decision R-25 (live queries).
 */
import { keepPreviousData, notifyManager, QueryObserver } from "@tanstack/query-core";
import type { QueryObserverOptions } from "@tanstack/query-core";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

import { clientRequest } from "#core/functions/client-request.function";
import { queryKeyOf } from "#core/functions/query-key-of.function";
import type { ClientError } from "#core/types/client-error.type";
import type { QueryRef } from "#core/types/query-ref.type";
import type { RefInput } from "#core/types/ref-input.type";
import type { RefOutput } from "#core/types/ref-output.type";
import type { UseQueryOptions } from "#react/query/use-query-options.type";
import type { UseQueryResult } from "#react/query/use-query-result.type";
import { useClientRuntime } from "#react/runtime/use-client-runtime";

/**
 * The answer of `query` for `input`.
 *
 * @throws Error outside a `ContainerProvider` whose container binds `ClientTransport` and `ServerStateCache`.
 * @example
 * const kpis = useQuery(OrderKpisQuery, { range: TimeRange.Today });
 * if (kpis.error) return <ErrorState error={kpis.error} onRetry={() => kpis.refetch()} />;
 */
export function useQuery<Q extends QueryRef>(
  query: Q,
  input: RefInput<Q>,
  options: UseQueryOptions = {},
): UseQueryResult<RefOutput<Q>> {
  const { transport, cache } = useClientRuntime();
  const observerOptions: QueryObserverOptions<RefOutput<Q>, ClientError> = {
    queryKey: queryKeyOf(query, input),
    // The transport decodes the answer with the query's output schema.
    queryFn: ({ signal }) =>
      transport.send(clientRequest(query, input, { signal })) as Promise<RefOutput<Q>>,
    enabled: options.enabled ?? true,
    ...(options.refetchOnFocus === undefined
      ? {}
      : { refetchOnWindowFocus: options.refetchOnFocus }),
    ...(options.keepPreviousData === true ? { placeholderData: keepPreviousData } : {}),
  };
  const [observer] = useState(() => new QueryObserver(cache.client, observerOptions));
  useEffect(() => {
    observer.setOptions(observerOptions);
  });
  useEffect(() => cache.watch(query), [cache, query]);
  useSyncExternalStore(
    useCallback(
      (onChange: () => void) => observer.subscribe(notifyManager.batchCalls(onChange)),
      [observer],
    ),
    () => observer.getCurrentResult(),
    () => observer.getCurrentResult(),
  );
  const result = observer.getOptimisticResult(cache.client.defaultQueryOptions(observerOptions));
  return {
    data: result.data,
    error: result.error,
    isPending: result.isPending,
    isLoading: result.isLoading,
    isFetching: result.isFetching,
    refetch: () => observer.refetch(),
  };
}
