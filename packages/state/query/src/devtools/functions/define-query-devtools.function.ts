/**
 * Stackra file contract:
 * Purpose: `defineQueryDevtools`, the devtools entry of @stackra/query: the `query.cache` tab (each cached query by its
 *          versioned key with status, fetch status, staleness, observers and last update) and the sensitive
 *          `query.mutations` tab (the offline mutation queue: pending calls, conflicts and whether it is draining).
 * Boundary: data only, no UI and no Pro import; the Pro panel (@stackra-pro/devtools) finds the tabs through the kit's
 *           host session. The cache tab names a query by the first segment of its key only, never its input or data,
 *           so it is not sensitive; the mutations tab carries call inputs and server records, so it is marked
 *           `sensitive` and the kit withholds it from a host that did not accept that. Development only (ADR 0246
 *           decision 1). It takes the kit by shape (`DevtoolsTabSink`), the same as container and events.
 * Runtime: isomorphic
 * Governing contract: ADR 0246 (decisions 2 and 4: the panel shows queries); ADR 0461; ADR 0079; ADR 0338.
 */
import type { DevtoolsTabSink } from "@stackra/container/devtools";

import type { MutationQueue } from "#core/services/mutation-queue.service";
import type { ServerStateCache } from "#core/services/server-state-cache.service";

/**
 * Defines the query devtools tabs.
 *
 * @param kit - the devtools kit (`DevtoolsKit`), or anything with its `defineTab`.
 * @param cache - the server-state cache (its TanStack client is read).
 * @param queue - the offline mutation queue (its state is read).
 * @returns removes both tabs.
 * @example
 * defineQueryDevtools(container.get(DevtoolsKit), container.get(ServerStateCache), container.get(MutationQueue));
 */
export function defineQueryDevtools(
  kit: DevtoolsTabSink,
  cache: Pick<ServerStateCache, "client">,
  queue: Pick<MutationQueue, "items" | "conflicts" | "pending" | "isDraining">,
): () => void {
  const removeCache = kit.defineTab({
    id: "query.cache",
    title: "Query cache",
    category: "query",
    read: () =>
      cache.client
        .getQueryCache()
        .getAll()
        .map((query) => ({
          query: String(query.queryKey[0]),
          status: query.state.status,
          fetchStatus: query.state.fetchStatus,
          stale: query.isStale(),
          observers: query.getObserversCount(),
          updatedAt: query.state.dataUpdatedAt,
        })),
  });
  const removeMutations = kit.defineTab({
    id: "query.mutations",
    title: "Offline mutations",
    category: "query",
    sensitive: true,
    read: () => ({
      pending: queue.pending,
      draining: queue.isDraining,
      items: queue.items,
      conflicts: queue.conflicts,
    }),
  });
  return () => {
    removeCache();
    removeMutations();
  };
}
