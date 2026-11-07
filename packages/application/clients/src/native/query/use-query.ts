/**
 * Stackra file contract:
 * Purpose: the native `useQuery`, a consumed query's answer in a React Native screen: the same cache, transport, input
 *          validation and live queries as `@stackra/clients/react`'s, and a stale answer refetched when the app comes
 *          back to the foreground (`AppState`), which is a phone's window focus.
 * Boundary: wraps the isomorphic hook and adds the app state subscription only. Reconnecting refetches through
 *           TanStack's online manager, which the host wires to its own network source. shortcut: `useInfiniteQuery`
 *           stays the react entry's (no foreground refetch); add a native one when a native screen pages by infinite
 *           scroll.
 * Runtime: react-native
 * Governing contract: ADR 0079 (TanStack Query core); ADR 0260 (decision 4); ADR 0164 (native parity).
 */
import { useEffect } from "react";
import { AppState } from "react-native";

import type { QueryRef } from "#core/types/query-ref.type";
import type { RefInput } from "#core/types/ref-input.type";
import type { RefOutput } from "#core/types/ref-output.type";
import { focusFromAppState } from "#native/functions/focus-from-app-state.function";
import { useQuery as useSharedQuery } from "#react/query/use-query";
import type { UseQueryOptions } from "#react/query/use-query-options.type";
import type { UseQueryResult } from "#react/query/use-query-result.type";

/**
 * The answer of `query` for `input`, refetched when the app returns to the foreground.
 *
 * @throws Error outside a `ContainerProvider` whose container binds `ClientTransport` and `ServerStateCache`.
 * @example
 * const orders = useQuery(ListOrdersQuery, { limit: 25 });
 * if (orders.error) return <ErrorState error={orders.error} retry={{ label, onPress: () => orders.refetch() }} />;
 */
export function useQuery<Q extends QueryRef>(
  query: Q,
  input: RefInput<Q>,
  options: UseQueryOptions = {},
): UseQueryResult<RefOutput<Q>> {
  useEffect(() => {
    const subscription = AppState.addEventListener("change", focusFromAppState);
    return () => subscription.remove();
  }, []);
  return useSharedQuery(query, input, options);
}
