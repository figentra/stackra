/**
 * Stackra file contract:
 * Purpose: `MemoryOutboxDriver`, the `OutboxDriver` of a test or a single process: messages in process memory, the
 *          payload stored as JSON as Postgres stores it, listed in the order Postgres lists them.
 * Boundary: no transaction: a write is kept at once, so a write whose caller rolls back stays (the Postgres driver is
 *           the transactional one). There are no scope settings in memory, so a message keeps the scope it is written
 *           with, if any, and no tenant: every claim is a platform row's, which needs no isolation.
 * Runtime: isomorphic
 * Governing contract: ADR 0078 (decision 4); ADR 0142 (drivers behind ports); ADR 0266 (memory first).
 */
import { Driver } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";

import { OutboxDriver } from "#contracts/index";
import type { OutboxClaim, OutboxError, OutboxMessage } from "#contracts/index";
import { holdsValue } from "#core/functions/holds-value.function";

/** Oldest first, by id within one instant: the relay's order. */
function byOrder(left: OutboxMessage, right: OutboxMessage): number {
  return (
    left.occurredAt.getTime() - right.occurredAt.getTime() ||
    (left.id < right.id ? -1 : left.id > right.id ? 1 : 0)
  );
}

/** The claim of a kept message: memory keeps no tenant, so every message is a platform row. */
function claimOf(message: OutboxMessage): OutboxClaim {
  return Object.freeze({ id: message.id, availableAt: message.availableAt });
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

  /** Implements `OutboxDriver.claim`, documented there. */
  claim(now: Date, limit: number): Promise<readonly OutboxClaim[]> {
    const at = now.getTime();
    return Promise.resolve(
      this.sorted((message) => message.deadAt === undefined && message.availableAt.getTime() <= at)
        .slice(0, limit)
        .map(claimOf),
    );
  }

  /** Implements `OutboxDriver.load`, documented there. */
  load(id: PublicId<"evt">): Promise<OutboxMessage | undefined> {
    return Promise.resolve(this.messages.get(id));
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

  /** Implements `OutboxDriver.claimDead`, documented there. */
  claimDead(before: Date, limit: number): Promise<readonly OutboxClaim[]> {
    return Promise.resolve(
      this.sorted(
        (message) => message.deadAt !== undefined && message.deadAt.getTime() < before.getTime(),
      )
        .slice(0, limit)
        .map(claimOf),
    );
  }

  /** Implements `OutboxDriver.holding`, documented there. */
  holding(value: string): Promise<readonly OutboxMessage[]> {
    return Promise.resolve(this.sorted((message) => holdsValue(message.data, value)));
  }

  /** Implements `OutboxDriver.rewrite`, documented there. */
  rewrite(id: PublicId<"evt">, data: unknown): Promise<void> {
    const message = this.messages.get(id);
    if (message !== undefined) {
      // oxlint-disable-next-line unicorn/prefer-structured-clone -- a JSON round trip on purpose, as in write
      const json: unknown = JSON.parse(JSON.stringify(data ?? null));
      this.messages.set(id, Object.freeze({ ...message, data: json }));
    }
    return Promise.resolve();
  }

  /** Every message kept, dead ones included, in the relay's order; for a test's assertions. */
  stored(): readonly OutboxMessage[] {
    return this.sorted(() => true);
  }

  /** The kept messages that pass `keep`, in the relay's order. */
  private sorted(keep: (message: OutboxMessage) => boolean): OutboxMessage[] {
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    return [...this.messages.values()].filter(keep).sort(byOrder);
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
