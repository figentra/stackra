/**
 * Stackra file contract:
 * Purpose: the `QueueLeader` port: whether this tab or window drains the offline queue now. Exactly one context of a
 *          device leads, so two tabs never replay the same entry; the console picks the driver with
 *          `QueryConfig.queueLeader` (`broadcast_channel`, `memory`).
 * Boundary: an abstract class that is its own token, keyed `query.QueueLeader`. The drivers live in
 *           `@stackra/coordinator`, over its leader election (Web Locks, else a BroadcastChannel heartbeat, else
 *           memory); a single-process target leads at once. The queue only reads the flag and drains when it turns on.
 * Runtime: isomorphic
 * Governing contract: ADR 0252 (a leader for the queue across tabs); ADR 0084 (the coordinator); ADR 0294 (decisions 4,
 *                     15 and 16).
 */
import { Port } from "@stackra/contracts";
import type { ReadonlySignal } from "@stackra/platform/contracts";

/**
 * Says whether this context drains the queue.
 *
 * @example
 * export class MemoryQueueLeaderDriver extends Driver(QueueLeader) {
 *   readonly isLeader = electLeader("query.queue", { method: ElectionMethod.Memory }).isLeader;
 * }
 */
export abstract class QueueLeader extends Port {
  /** Type-only port key, so `DriverName<QueueLeader>` narrows to this port's drivers. */
  declare readonly "~key": "query.QueueLeader";

  /** True while this context leads; the queue drains when it turns true. */
  abstract readonly isLeader: ReadonlySignal<boolean>;
}
