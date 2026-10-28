/**
 * Stackra file contract:
 * Purpose: unit tests of `OutboxRelayService`: a tick publishes a due event as its envelope and deletes it; holds a
 *          part batch inside the batch window; hands a row
 *          change to each bound consumer of its model in the row's scope (or none) and skips an unbound one; retries a
 *          failed delivery after its backoff and dead-letters (and logs) it after the last attempt; does nothing while
 *          another relay holds the lock; refuses to run before `connect`; `work` ticks until aborted. From the change
 *          log it hands each bound consumer the changes after its cursor run by run in each run's scope (coalesced to
 *          `consumeMany` when the consumer has it), saves the cursor, keeps the log, backs a failed consumer off from
 *          its kept progress and stalls it (logged) after the last attempt, and skips a stalled cursor.
 * Boundary: test only; the memory store, the memory lock driver, a recording publisher, a stand-in database that
 *           records the scopes it opens, a fixed clock and a map resolver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0078 (decision 4); ADR 0221 (decision 5); ADR 0327 (decision 9).
 */
import type { Resolver } from "@stackra/actions";
import { buildConfig } from "@stackra/config";
import { type AnyClass, Driver } from "@stackra/container";
import { type Clock, Duration, Logger, type PublicId, type ScopeRef } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import { Locks, MemoryLockDriver } from "@stackra/locking";
import { describe, expect, it } from "@stackra/testing";

import { OutboxConfig } from "#config/outbox.config";
import { EventPublisher, MessageKind, RowChangeKind } from "#contracts/index";
import type { EventEnvelope, OutboxMessage, RowChange } from "#contracts/index";
import { MemoryChangeFeedDriver } from "#core/drivers/memory-change-feed.driver";
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

class Order {}

class BatchConsumer {
  readonly batches: (readonly RowChange[])[] = [];

  failing = false;

  async consume(): Promise<void> {
    throw new TypeError("consumeMany is used");
  }

  async consumeMany(changes: readonly RowChange[]): Promise<void> {
    if (this.failing) throw new TypeError("index down");
    this.batches.push(changes);
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
  [Order, BatchConsumer],
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
function relayOf(lockDriver = new MemoryLockDriver(clock), batchWindowSeconds = 0) {
  const store = new MemoryOutboxDriver();
  const feed = new MemoryChangeFeedDriver();
  const publisher = new RecordingPublisher();
  const logger = new RecordingLogger();
  const consumer = new IndexConsumer();
  const batch = new BatchConsumer();
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
    [BatchConsumer, batch],
  ]);
  const resolver: Resolver = {
    has: (type) => bound.has(type),
    get: <T extends object>(type: AnyClass<T>) => bound.get(type) as T,
  };
  const relay = new OutboxRelayService(
    store,
    feed,
    publisher,
    new Locks(lockDriver, clock),
    database,
    clock,
    buildConfig(OutboxConfig, { values: { batchWindowSeconds } }),
  );
  relay.connect(resolver);
  return { relay, store, feed, publisher, logger, consumer, batch, scopes };
}

/** An updated Order change of `id` writing `field`. */
function order(id: string, field: string): RowChange {
  return { model: "Order", id, kind: RowChangeKind.Updated, fields: [field] };
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

  it("holds a part batch until its oldest message has been due for the batch window", async () => {
    const { relay, store, publisher } = relayOf(undefined, 5);
    await store.write([eventMessage({ availableAt: new Date(NOON.getTime() - 4000) })]);
    await expect(relay.relay()).resolves.toBe(0);
    expect(publisher.published).toEqual([]);
    await store.write([
      eventMessage({ id: "evt_B", availableAt: new Date(NOON.getTime() - 5000) }),
    ]);
    await expect(relay.relay()).resolves.toBe(2);
    expect(store.stored()).toEqual([]);
  });

  it("refuses to run before connect", async () => {
    const relay = new OutboxRelayService(
      new MemoryOutboxDriver(),
      new MemoryChangeFeedDriver(),
      new RecordingPublisher(),
      new Locks(new MemoryLockDriver(clock), clock),
      {} as Database,
      clock,
      buildConfig(OutboxConfig),
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

  it("hands each consumer the log after its cursor, run by run in each scope, and keeps the log", async () => {
    const { relay, feed, consumer, batch, scopes } = relayOf();
    const product: RowChange = {
      model: "Product",
      id: "prd_1",
      kind: RowChangeKind.Updated,
      fields: ["name"],
    };
    await feed.append([
      { change: product, meta: {}, occurredAt: NOON, scope: SCOPE },
      { change: order("ord_1", "total"), meta: {}, occurredAt: NOON, scope: SCOPE },
      { change: order("ord_1", "status"), meta: {}, occurredAt: NOON, scope: SCOPE },
      { change: order("ord_2", "total"), meta: {}, occurredAt: NOON },
    ]);
    await expect(relay.relay()).resolves.toBe(4);
    expect(consumer.seen).toEqual([product]);
    expect(batch.batches).toEqual([
      [{ ...order("ord_1", "total"), fields: ["total", "status"] }],
      [order("ord_2", "total")],
    ]);
    expect(scopes).toEqual([SCOPE, SCOPE, []]);
    expect(feed.stored()).toHaveLength(4);
    await expect(feed.cursor("BatchConsumer")).resolves.toMatchObject({
      position: feed.stored()[3]?.position,
      attempts: 0,
    });
    await expect(relay.relay()).resolves.toBe(0);
  });

  it("backs a failed consumer off from its cursor, then stalls it at the last attempt", async () => {
    const { relay, feed, batch, logger } = relayOf();
    batch.failing = true;
    await feed.append([
      {
        change: { model: "Order", id: "ord_1", kind: RowChangeKind.Created, fields: [] },
        meta: {},
        occurredAt: NOON,
      },
    ]);
    await relay.relay();
    const retried = await feed.cursor("BatchConsumer");
    expect(retried).toMatchObject({
      attempts: 1,
      lastError: { code: "internal", message: "index down" },
    });
    expect(retried?.position).toBeUndefined();
    expect((retried?.availableAt.getTime() ?? 0) > NOON.getTime()).toBe(true);
    await feed.save({ consumer: "BatchConsumer", attempts: 9, availableAt: NOON });
    await relay.relay();
    await expect(feed.cursor("BatchConsumer")).resolves.toMatchObject({
      attempts: 10,
      stalledAt: NOON,
    });
    expect(logger.errors).toEqual(["outbox.consumer_stalled"]);
    batch.failing = false;
    await expect(relay.relay()).resolves.toBe(0);
  });
});
