/**
 * Stackra file contract:
 * Purpose: `useReplica(query)`, the hook a screen reads a bounded replica with (ADR 0338 decision 3): `{ data, asOf }`
 *          from the nearest container's `ReplicaStore`, re-rendering after every refresh, so the screen always shows how
 *          old its data is.
 * Boundary: resolves by class from the container and builds nothing; throws outside a `ContainerProvider`, when the
 *           container binds no `ReplicaStore`, or when `query` was not declared a replica (it is not available
 *           offline). Subscribes through `useSyncExternalStore` on the store's version, so concurrent renders never
 *           tear; the snapshot is the same object until the replica changes.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decision 3); ADR 0294 (decision 17); ADR 0295 (decision 10).
 */
import { useContainer } from "@stackra/container/react";
import { useSyncExternalStore } from "react";

import { ReplicaStore } from "#core/index";
import type { ReplicaRef } from "#core/index";
import type { ReplicaSnapshot } from "#core/types/replica-snapshot.type";

/**
 * A replica and its "as of" time.
 *
 * @throws Error outside a `ContainerProvider`, or when the container does not bind `ReplicaStore`.
 * @throws TypeError when `query` was not declared a replica.
 * @example
 * const { data, asOf } = useReplica(RecentSalesQuery);
 * return <Caption>{t(I18n.sales.replica.asOf, { asOf })}</Caption>;
 */
export function useReplica(query: ReplicaRef): ReplicaSnapshot {
  const replicas = useContainer().get(ReplicaStore);
  useSyncExternalStore(replicas.subscribe, replicas.version, replicas.version);
  return replicas.read(query);
}
