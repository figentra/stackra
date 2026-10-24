/**
 * Stackra file contract:
 * Purpose: `useMutationQueue()`, the hook the offline banner, the pending-changes view and a scope switch read the
 *          offline queue with: the `MutationQueue` of the nearest container (`pending`, `items`, `conflicts`,
 *          `isDraining`, `drain`, `resolve`, `discard`), re-rendering after every change of it.
 * Boundary: resolves by class from the container and builds nothing; throws outside a `ContainerProvider` or when the
 *           container binds no queue, so a missing query context is never a silent empty queue. Subscribes through
 *           `useSyncExternalStore` on the queue's version, so concurrent renders never tear. Returns the queue itself.
 * Runtime: isomorphic
 * Governing contract: ADR 0252; ADR 0059 (decision 3); ADR 0294 (decision 17); ADR 0295 (decision 10).
 */
import { useContainer } from "@stackra/container/react";
import { useSyncExternalStore } from "react";

import { MutationQueue } from "#core/index";

/**
 * The offline mutation queue.
 *
 * @throws Error outside a `ContainerProvider`, or when the container does not bind `MutationQueue`.
 * @example
 * const queue = useMutationQueue();
 * return { pending: queue.pending, conflicts: queue.conflicts.length, retry: () => queue.drain() };
 */
export function useMutationQueue(): MutationQueue {
  const queue = useContainer().get(MutationQueue);
  useSyncExternalStore(queue.subscribe, queue.version, queue.version);
  return queue;
}
