/**
 * Stackra file contract:
 * Purpose: the `memory` driver of the `RealtimeFanout` port, the one a test's `useDrivers("memory")` picks: the `local`
 *          driver's in-process delivery, plus `published`, every message in the order it was published, for a test
 *          to assert on.
 * Boundary: no network; one process only. Delivery is a macrotask after `publish` resolves, as in `local`, so code
 *           under test sees the same order. A subscriber that throws is skipped. The log grows until `clear()`.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (decision 2: memory first); ADR 0269 (fakes are real drivers); ADR 0225 (decision 1).
 */
import { Driver } from "@stackra/container";

import { RealtimeFanout } from "#contracts/ports/realtime-fanout.port";
import type { FanoutMessage } from "#contracts/types/fanout-message.type";
import { LocalRealtimeFanoutDriver } from "#core/drivers/local-realtime-fanout.driver";

/**
 * Fans out within this process and keeps what it carried.
 *
 * @example
 * const fanout = app.get(RealtimeFanout) as MemoryRealtimeFanoutDriver;
 * expect(fanout.published).toHaveLength(1);
 */
export class MemoryRealtimeFanoutDriver extends Driver(RealtimeFanout) {
  /** Every message published, oldest first. */
  readonly published: FanoutMessage[] = [];

  /** Delivers to this process's subscribers. */
  private readonly local = new LocalRealtimeFanoutDriver();

  /** Implements `RealtimeFanout.publish`, documented there. */
  publish(message: FanoutMessage): Promise<void> {
    this.published.push(message);
    return this.local.publish(message);
  }

  /** Implements `RealtimeFanout.subscribe`, documented there. */
  subscribe(receive: (message: FanoutMessage) => void): () => void {
    return this.local.subscribe(receive);
  }

  /** Forgets the messages published so far. */
  clear(): void {
    this.published.length = 0;
  }
}
