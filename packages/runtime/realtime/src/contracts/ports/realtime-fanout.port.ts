/**
 * Stackra file contract:
 * Purpose: the `RealtimeFanout` port: carries broadcasts and room frames between the instances of one service, so a
 *          session connected to any instance receives what any instance publishes. Config `realtime.fanout` picks the
 *          driver (`local` for one instance, `valkey` for Valkey pub/sub).
 * Boundary: an abstract class that is its own token, keyed `realtime.RealtimeFanout`. Delivery is at most once and
 *           unordered across publishers: a refresh is data-free and a CRDT update merges in any order, so neither needs
 *           more. A subscriber receives every message, its own instance's included. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 1: a native driver on Valkey or Postgres pub/sub); ADR 0346 (decision 5:
 *                     every driver carries rooms); ADR 0294 (decisions 4, 15 and 16); ADR 0263.
 */
import { Port } from "@stackra/contracts";

import type { FanoutMessage } from "#contracts/types/fanout-message.type";

/**
 * Fans messages out to every instance.
 *
 * @example
 * const stop = fanout.subscribe((message) => relay.deliver(message));
 * await fanout.publish({ kind: "broadcast", broadcast });
 */
export abstract class RealtimeFanout extends Port {
  /** Type-only port key, so `DriverName<RealtimeFanout>` narrows to this port's drivers. */
  declare readonly "~key": "realtime.RealtimeFanout";

  /** Hands `message` to every instance; resolves once the transport has it. */
  abstract publish(message: FanoutMessage): Promise<void>;

  /**
   * Calls `receive` with every message any instance publishes from now on.
   *
   * @returns stops the subscription.
   */
  abstract subscribe(receive: (message: FanoutMessage) => void): () => void;
}
