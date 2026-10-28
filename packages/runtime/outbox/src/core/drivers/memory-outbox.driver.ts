/**
 * Stackra file contract:
 * Purpose: `MemoryOutboxDriver`, the `OutboxDriver` of a test or a single process: messages in process memory, the
 *          payload stored as JSON as Postgres stores it, listed in the order Postgres lists them.
 * Boundary: no transaction: a write is kept at once, so a write whose caller rolls back stays (the Postgres driver is
 *           the transactional one). There are no scope settings in memory, so a message keeps the scope it is written
 *           with, if any.
 * Runtime: isomorphic
 * Governing contract: ADR 0078 (decision 4); ADR 0142 (drivers behind ports); ADR 0266 (memory first).
 */
import { Driver } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";

import { OutboxDriver } from "#contracts/index";
import type { OutboxError, OutboxMessage } from "#contracts/index";

/** Oldest first, by id within one instant: the relay's order. */
function byOrder(left: OutboxMessage, right: OutboxMessage): number {
  return (
    left.occurredAt.getTime() - right.occurredAt.getTime() ||
    (left.id < right.id ? -1 : left.id > right.id ? 1 : 0)
  );
}

/**
 * Keeps messages in memory.
 *
 * @example
 * const driver = new MemoryOutboxDriver();
 * await driver.write([message]);
 */
export class MemoryOutboxDriver extends Driver(OutboxDriver) {
  /** Message id to message. */
  private readonly messages = new Map<string, OutboxMessage>();

  /** Implements `OutboxDriver.write`, documented there. */
  write(messages: readonly OutboxMessage[]): Promise<void> {
    for (const message of messages) {
      // oxlint-disable-next-line unicorn/prefer-structured-clone -- a JSON round trip on purpose: it is what the wire does (Dates become strings, undefined and functions drop)
      const data: unknown = JSON.parse(JSON.stringify(message.data ?? null));
      this.messages.set(message.id, Object.freeze({ ...message, data }));
    }
    return Promise.resolve();
  }

  /** Implements `OutboxDriver.due`, documented there. */
  due(now: Date, limit: number): Promise<readonly OutboxMessage[]> {
    const at = now.getTime();
    const due = [...this.messages.values()]
      .filter((message) => message.deadAt === undefined && message.availableAt.getTime() <= at)
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      .sort(byOrder);
    return Promise.resolve(due.slice(0, limit));
  }

  /** Implements `OutboxDriver.remove`, documented there. */
  remove(id: PublicId<"evt">): Promise<void> {
    this.messages.delete(id);
    return Promise.resolve();
  }

  /** Implements `OutboxDriver.retry`, documented there. */
  retry(id: PublicId<"evt">, availableAt: Date, error: OutboxError): Promise<void> {
    this.failed(id, { availableAt, lastError: error });
    return Promise.resolve();
  }

  /** Implements `OutboxDriver.deadLetter`, documented there. */
  deadLetter(id: PublicId<"evt">, error: OutboxError, at: Date): Promise<void> {
    this.failed(id, { deadAt: at, lastError: error });
    return Promise.resolve();
  }

  /** Every message kept, dead ones included, in the relay's order; for a test's assertions. */
  stored(): readonly OutboxMessage[] {
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    return [...this.messages.values()].sort(byOrder);
  }

  /** Counts a failed delivery of message `id` and replaces `fields`; a message no longer kept is left alone. */
  private failed(id: string, fields: Partial<OutboxMessage>): void {
    const message = this.messages.get(id);
    if (message !== undefined)
      this.messages.set(
        id,
        Object.freeze({ ...message, ...fields, attempts: message.attempts + 1 }),
      );
  }
}
