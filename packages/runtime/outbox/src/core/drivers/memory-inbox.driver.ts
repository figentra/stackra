/**
 * Stackra file contract:
 * Purpose: `MemoryInboxDriver`, the `InboxDriver` of a test or a single process: the received event ids in process
 *          memory with the instant each was received.
 * Boundary: no transaction: a claim is kept at once, so a claim whose listeners' transaction rolls back stays (the
 *           Postgres driver is the transactional one).
 * Runtime: isomorphic
 * Governing contract: ADR 0078 (decision 4); ADR 0142; ADR 0266 (memory first).
 */
import { Driver } from "@stackra/container";

import { InboxDriver } from "#contracts/index";

/**
 * Keeps received event ids in memory.
 *
 * @example
 * const inbox = new MemoryInboxDriver();
 * await inbox.claim("evt_1", now); // true, then false for the same id
 */
export class MemoryInboxDriver extends Driver(InboxDriver) {
  /** Event id to when it was received, in epoch milliseconds. */
  private readonly received = new Map<string, number>();

  /** Implements `InboxDriver.claim`, documented there. */
  claim(eventId: string, at: Date): Promise<boolean> {
    if (this.received.has(eventId)) return Promise.resolve(false);
    this.received.set(eventId, at.getTime());
    return Promise.resolve(true);
  }

  /** Implements `InboxDriver.prune`, documented there. */
  prune(before: Date): Promise<void> {
    for (const [eventId, at] of this.received)
      if (at < before.getTime()) this.received.delete(eventId);
    return Promise.resolve();
  }
}
