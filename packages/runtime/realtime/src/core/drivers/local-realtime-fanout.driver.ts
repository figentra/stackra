/**
 * Stackra file contract:
 * Purpose: the `local` driver of the `RealtimeFanout` port (the default): a service with one instance fans out to
 *          itself, delivering each message to this process's subscribers after `publish` resolves.
 * Boundary: no network; one process only. A subscriber that throws is skipped, never the publish.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (decision 2: memory first); ADR 0225 (decision 1).
 */
import { Driver } from "@stackra/container";

import { RealtimeFanout } from "#contracts/ports/realtime-fanout.port";
import type { FanoutMessage } from "#contracts/types/fanout-message.type";

/**
 * Fans out within this process.
 *
 * @example
 * const fanout = new LocalRealtimeFanoutDriver();
 * fanout.subscribe((message) => seen.push(message));
 */
export class LocalRealtimeFanoutDriver extends Driver(RealtimeFanout) {
  private readonly receivers = new Set<(message: FanoutMessage) => void>();

  /** See `RealtimeFanout.publish`. */
  publish(message: FanoutMessage): Promise<void> {
    for (const receive of this.receivers)
      queueMicrotask(() => {
        try {
          receive(message);
        } catch {
          // One receiver must not stop the others.
        }
      });
    return Promise.resolve();
  }

  /** See `RealtimeFanout.subscribe`. */
  subscribe(receive: (message: FanoutMessage) => void): () => void {
    this.receivers.add(receive);
    return () => {
      this.receivers.delete(receive);
    };
  }
}
