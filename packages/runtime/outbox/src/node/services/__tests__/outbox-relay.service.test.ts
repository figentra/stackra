/**
 * Stackra file contract:
 * Purpose: unit tests of `OutboxRelayService`: a tick publishes a due event as its envelope and deletes it; hands a row
 *          change to each bound consumer of its model in the row's scope (or none) and skips an unbound one; retries a
 *          failed delivery after its backoff and dead-letters (and logs) it after the last attempt; does nothing while
 *          another relay holds the lock; refuses to run before `connect`; `work` ticks until aborted.
 * Boundary: test only; the memory store, the memory lock driver, a recording publisher, a stand-in database that
 *           records the scopes it opens, a fixed clock and a map resolver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0078 (decision 4); ADR 0221 (decision 5); ADR 0327 (decision 9).
 */
import type { Resolver } from "@stackra/actions";
import { type AnyClass, Driver } from "@stackra/container";
import { type Clock, Duration, Logger, type PublicId, type ScopeRef } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import { Locks, MemoryLockDriver } from "@stackra/locking";
import { describe, expect, it } from "@stackra/testing";

import { EventPublisher, MessageKind, RowChangeKind } from "#contracts/index";
import type { EventEnvelope, OutboxMessage, RowChange } from "#contracts/index";
import { MemoryOutboxDriver } from "#core/drivers/memory-outbox.driver";
import { registerChangeConsumers } from "#core/functions/register-change-consumers.function";
import { OutboxRelayService } from "#node/services/outbox-relay.service";

const NOON = new Date(Date.UTC(2026, 9, 25, 12));

const clock = { now: () => new Date(NOON) } as Clock;

const SCOPE: ScopeRef = { id: "scp_1", path: "platform.acme" };

class RecordingPublisher extends Driver(EventPublisher) {
  readonly published: EventEnvelope[] = [];

  failing = false;

  async publish(envelope: EventEnvelope): Promise<void> {
    if (this.failing) throw new TypeError("transport down");
    this.published.push(envelope);
  }
}

class RecordingLogger extends Logger {
  readonly errors: string[] = [];

  debug(): void {}

  info(): void {}

  warn(): void {}

  error(event: string): void {
    this.errors.push(event);
  }
}

class Product {}

class IndexConsumer {
  readonly seen: RowChange[] = [];

  async consume(change: RowChange): Promise<void> {
    this.seen.push(change);
  }
}

class UnboundConsumer {
  async consume(): Promise<void> {
    throw new TypeError("never resolved");
  }
}

registerChangeConsumers([
  [Product, IndexConsumer],
  [Product, UnboundConsumer],
]);

/** An event message due at noon. */
function eventMessage(fields: Partial<OutboxMessage> = {}): OutboxMessage {
  return {
    id: "evt_A",
    kind: MessageKind.Event,
    type: "orders.order.paid.v1",
    data: { orderId: "ord_1" },
    meta: { correlationId: "call-1" },
    occurredAt: NOON,
    attempts: 0,
    availableAt: NOON,
    ...fields,
  };
}

/** A relay over memory stores, connected to a resolver that binds the logger and the index consumer. */
function relayOf(lockDriver = new MemoryLockDriver(clock)) {
  const store = new MemoryOutboxDriver();
  const publisher = new RecordingPublisher();
  const logger = new RecordingLogger();
  const consumer = new IndexConsumer();
  const scopes: (ScopeRef | readonly ScopeRef[])[] = [];
  const database = {
    withScope: async <T>(scope: ScopeRef | readonly ScopeRef[], work: () => Promise<T>) => {
      scopes.push(scope);
      return work();
    },
  } as unknown as Database;
  const bound = new Map<AnyClass, object>([
    [Logger, logger],
    [IndexConsumer, consumer],
  ]);
  const resolver: Resolver = {
    has: (type) => bound.has(type),
    get: <T extends object>(type: AnyClass<T>) => bound.get(type) as T,
  };
  const relay = new OutboxRelayService(
    store,
    publisher,
    new Locks(lockDriver, clock),
    database,
    clock,
  );
  relay.connect(resolver);
  return { relay, store, publisher, logger, consumer, scopes };
}

describe(OutboxRelayService, () => {
  it("publishes a due event as its envelope and deletes it", async () => {
    const { relay, store, publisher } = relayOf();
    await store.write([eventMessage({ scope: SCOPE })]);
    await expect(relay.relay()).resolves.toBe(1);
    expect(publisher.published).toEqual([
      {
        id: "evt_A",
        type: "orders.order.paid.v1",
        occurredAt: NOON.toISOString(),
        scope: SCOPE,
        meta: { correlationId: "call-1" },
        data: { orderId: "ord_1" },
      },
    ]);
    expect(store.stored()).toEqual([]);
  });

  it("hands a row change to each bound consumer in the row's scope, or in none", async () => {
    const { relay, store, consumer, scopes } = relayOf();
    const change: RowChange = {
      model: "Product",
      id: "prd_1",
      kind: RowChangeKind.Updated,
      fields: ["name"],
    };
    const changeMessage = (id: PublicId<"evt">, scope?: ScopeRef): OutboxMessage =>
      eventMessage({
        id,
        kind: MessageKind.Change,
        type: "Product",
        data: change,
        ...(scope === undefined ? {} : { scope }),
      });
    await store.write([changeMessage("evt_A", SCOPE), changeMessage("evt_B")]);
    await expect(relay.relay()).resolves.toBe(2);
    expect(consumer.seen).toEqual([change, change]);
    expect(scopes).toEqual([SCOPE, []]);
    expect(store.stored()).toEqual([]);
  });

  it("retries a failed delivery after its backoff, then dead-letters it at the last attempt", async () => {
    const { relay, store, publisher, logger } = relayOf();
    publisher.failing = true;
    await store.write([
      eventMessage({ id: "evt_A", attempts: 8 }),
      eventMessage({ id: "evt_B", attempts: 9 }),
    ]);
    await expect(relay.relay()).resolves.toBe(2);
    const [retried, dead] = store.stored();
    expect(retried).toMatchObject({
      id: "evt_A",
      attempts: 9,
      lastError: { code: "internal", message: "transport down" },
    });
    // the ninth exponential wait: ten seconds doubled eight times, up to half again of jitter, capped at an hour
    const wait = (retried?.availableAt.getTime() ?? 0) - NOON.getTime();
    expect(wait).toBeGreaterThanOrEqual(2_560_000);
    expect(wait).toBeLessThanOrEqual(3_600_000);
    expect(dead).toMatchObject({ id: "evt_B", attempts: 10, deadAt: NOON });
    expect(logger.errors).toEqual(["outbox.message_dead"]);
  });

  it("does nothing while another relay holds the lock", async () => {
    const lockDriver = new MemoryLockDriver(clock);
    const { relay, store, publisher } = relayOf(lockDriver);
    await store.write([eventMessage()]);
    const other = new Locks(lockDriver, clock);
    await other.tryWith("outbox.relay", Duration.minutes(1), async () => {
      await expect(relay.relay()).resolves.toBe(0);
    });
    expect(publisher.published).toEqual([]);
  });

  it("refuses to run before connect", async () => {
    const relay = new OutboxRelayService(
      new MemoryOutboxDriver(),
      new RecordingPublisher(),
      new Locks(new MemoryLockDriver(clock), clock),
      {} as Database,
      clock,
    );
    await expect(relay.relay()).rejects.toThrow(/not connected/);
  });

  it("ticks until the signal aborts", async () => {
    const { relay, store, publisher } = relayOf();
    const controller = new AbortController();
    await store.write([eventMessage()]);
    const publish = publisher.publish.bind(publisher);
    publisher.publish = async (envelope) => {
      await publish(envelope);
      controller.abort();
    };
    await relay.work({ signal: controller.signal });
    expect(publisher.published).toHaveLength(1);
  });
});
