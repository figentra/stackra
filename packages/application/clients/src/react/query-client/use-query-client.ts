/**
 * Stackra file contract:
 * Purpose: `useQueryClient`, imperative access to consumed queries in a component: `fetch(Query, input)` outside a
 *          render (a scanner's lookup) and `invalidate(Query)` after a change.
 * Boundary: the same cache keys and transport as `useQuery`; one object per container.
 * Runtime: browser, react-native
 * Governing contract: ADR 0079 (TanStack Query core); ADR 0260 (decision 4).
 */
import { useMemo } from "react";

import { clientRequest } from "#core/functions/client-request.function";
import { queryKeyOf } from "#core/functions/query-key-of.function";
import type { QueryRef } from "#core/types/query-ref.type";
import type { RefInput } from "#core/types/ref-input.type";
import type { RefOutput } from "#core/types/ref-output.type";
import type { ClientQueries } from "#react/query-client/client-queries.type";
import { useClientRuntime } from "#react/runtime/use-client-runtime";

/**
 * The consumed queries of the container above.
 *
 * @throws Error outside a `ContainerProvider` whose container binds `ClientTransport` and `ServerStateCache`.
 * @example
 * const client = useQueryClient();
 * const hit = await client.fetch(GetVariantByBarcodeQuery, { barcode });
 */
export function useQueryClient(): ClientQueries {
  const { transport, cache } = useClientRuntime();
  return useMemo<ClientQueries>(
    () => ({
      fetch: <Q extends QueryRef>(query: Q, input: RefInput<Q>) =>
        cache.client.fetchQuery({
          queryKey: queryKeyOf(query, input),
          // The transport decodes the answer with the query's output schema.
          queryFn: ({ signal }) =>
            transport.send(clientRequest(query, input, { signal })) as Promise<RefOutput<Q>>,
        }),
      invalidate: (query, input) =>
        cache.client.invalidateQueries({
          queryKey: input === undefined ? [query.key] : queryKeyOf(query, input),
        }),
    }),
    [transport, cache],
  );
}
