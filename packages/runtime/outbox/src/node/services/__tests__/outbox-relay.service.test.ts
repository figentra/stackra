/**
 * Stackra file contract:
 * Purpose: unit tests of `OutboxRelayService`: a tick publishes a due event as its envelope and deletes it; holds a
 *          part batch inside the batch window; hands a row
 *          change to each bound consumer of its model in the row's scope (or none) and skips an unbound one; retries a
 *          failed delivery after its backoff and dead-letters (and logs) it after the last attempt; does nothing while
 *          another relay holds the lock; refuses to run before `connect`; `work` ticks until aborted. From the change
 *          log it hands each bound consumer the changes after its cursor run by run in each run's scope (coalesced to
 *          `consumeMany` when the consumer has it), saves the cursor, keeps the log, backs a failed consumer off from
 *          its kept progress and stalls it (logged) after the last attempt, and skips a stalled cursor. An event with a
 *          live change is published again at the older version, same id, its data run through `down` (stackra-403).
 *          An owned claim is loaded, fanned out and removed (or retried) in its owner through the bound isolation, and
 *          its changes loaded in their owner; an owned claim with no isolation bound, or a claim that does not load,
 *          fails the tick and is never skipped.
 * Boundary: test only; the memory store, the memory lock driver, a recording publisher, a stand-in database that
 *           records the scopes it opens, a fixed clock and a map resolver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0078 (decision 4); ADR 0221 (decision 5); ADR 0327 (decision 9).
 */
import { ClaimNotLoadedError, RowIsolationMissingError } from "@stackra/actions";
import type { Resolver } from "@stackra/actions";
import { CallIsolation } from "@stackra/actions/contracts";
import { buildConfig } from "@stackra/config";
import { type AnyClass, Driver } from "@stackra/container";
import {
  type Actor,
  ActorKind,
  type Clock,
  Duration,
  Logger,
  type PublicId,
  Realm,
  type ScopeRef,
} from "@stackra/contracts";
import type { Database } from "@stackra/database";
import { Locks, MemoryLockDriver } from "@stackra/locking";
import { IntegrationEvent } from "@stackra/events";
import { describe, expect, it } from "@stackra/testing";
import { registerSchemas } from "@stackra/validation";
import { Change, registerChanges } from "@stackra/versioning";
import { z } from "zod";

import { OutboxConfig } from "#config/outbox.config";
import { EventPublisher, MessageKind, RowChangeKind } from "#contracts/index";
import type { EventEnvelope, OutboxMessage, RowChange } from "#contracts/index";
import { MemoryChangeFeedDriver } from "#core/drivers/memory-change-feed.driver";
import { MemoryOutboxDriver } from "#core/drivers/memory-outbox.driver";
import { registerChangeConsumers } from "#core/functions/register-change-consumers.function";
import { registerEventNames } from "#core/functions/register-event-names.function";
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

class PointsEarned extends IntegrationEvent({
  name: "points.earned",
  version: 2,
}) {
  memberId!: string;

  tier!: string;
}

class PointsEarnedV1Change extends Change<PointsEarned>({
  from: 1,
  sunset: "2027-04-01",
}) {
  memberId!: string;

  up(v1: PointsEarnedV1Change): PointsEarned {
    return PointsEarned.create({ memberId: v1.memberId, tier: "bronze" });
  }

  down(v2: PointsEarned): PointsEarnedV1Change {
    return PointsEarnedV1Change.create({ memberId: v2.memberId });
  }
}

registerSchemas([
  [PointsEarned, z.object({ memberId: z.string(), tier: z.string() })],
  [PointsEarnedV1Change, z.object({ memberId: z.string() })],
]);
registerEventNames([{ type: PointsEarned, name: "loyalty.points.earned.v2" }]);
registerChanges([[PointsEarned, PointsEarnedV1Change]]);

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
function relayOf(
  lockDriver = new MemoryLockDriver(clock),
  batchWindowSeconds = 0,
  extra: readonly (readonly [AnyClass, object])[] = [],
) {
  const store = new MemoryOutboxDriver();
  const feed = new MemoryChangeFeedDriver();
  const publisher = new RecordingPublisher();
  const logger = new RecordingLogger();
  const consumer = new IndexConsumer();
  const batch = new BatchConsumer();
  const scopes: (ScopeRef | readonly ScopeRef[])[] = [];
  const database = {
    transaction: async <T>(work: () => Promise<T>) => work(),
    withScope: async <T>(scope: ScopeRef | readonly ScopeRef[], work: () => Promise<T>) => {
      scopes.push(scope);
      return work();
    },
  } as unknown as Database;
  const bound = new Map<AnyClass, object>([
    [Logger, logger],
    [IndexConsumer, consumer],
    [BatchConsumer, batch],
    ...extra,
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

  it("publishes an event again at each older version a live change serves, under the same id", async () => {
    const { relay, store, publisher } = relayOf();
    await store.write([
      eventMessage({
        type: "loyalty.points.earned.v2",
        data: { memberId: "mem_1", tier: "gold" },
      }),
    ]);
    await expect(relay.relay()).resolves.toBe(1);
    expect(
      publisher.published.map(({ id, type, data }) => ({
        id,
        type,
        data: { ...(data as object) },
      })),
    ).toEqual([
      { id: "evt_A", type: "loyalty.points.earned.v2", data: { memberId: "mem_1", tier: "gold" } },
      { id: "evt_A", type: "loyalty.points.earned.v1", data: { memberId: "mem_1" } },
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

  it("runs each consumer delivery through a bound CallIsolation as the stored actor, or a platform actor, in the stored scope", async () => {
    const runs: [Actor, ScopeRef | readonly ScopeRef[] | undefined, boolean][] = [];
    class Recording extends Driver(CallIsolation) {
      run<T>(
        actor: Actor,
        scope: ScopeRef | readonly ScopeRef[] | undefined,
        work: () => Promise<T>,
        options: { readonly readOnly: boolean },
      ): Promise<T> {
        runs.push([actor, scope, options.readOnly]);
        return work();
      }
    }
    const { relay, feed, store, consumer, batch, scopes } = relayOf(
      new MemoryLockDriver(clock),
      0,
      [[CallIsolation, new Recording()]],
    );
    const actor: Actor = {
      kind: ActorKind.User,
      id: "usr_1",
      realm: Realm.Staff,
      scopeId: SCOPE.id,
    };
    const change: RowChange = {
      model: "Product",
      id: "prd_1",
      kind: RowChangeKind.Updated,
      fields: ["name"],
    };
    await store.write([
      eventMessage({
        kind: MessageKind.Change,
        type: "Product",
        data: change,
        scope: SCOPE,
        meta: { actor },
      }),
    ]);
    await feed.append([
      { change: order("ord_1", "total"), meta: { actor }, occurredAt: NOON, scope: SCOPE },
      { change: order("ord_2", "total"), meta: { actor }, occurredAt: NOON, scope: SCOPE },
      { change: order("ord_3", "total"), meta: {}, occurredAt: NOON, scope: SCOPE },
    ]);
    await relay.relay();
    expect(consumer.seen).toEqual([change]);
    // a run of changes splits where the actor changes
    expect(batch.batches).toHaveLength(2);
    const platform = { kind: ActorKind.System, id: "sys_outbox_relay" };
    // the message's load and removal, and the log's load, run as the platform: memory claims have no owner
    expect(runs).toEqual([
      [platform, undefined, false],
      [actor, SCOPE, false],
      [platform, undefined, false],
      [platform, undefined, false],
      [actor, SCOPE, false],
      [platform, SCOPE, false],
    ]);
    expect(scopes).toEqual([]);
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

/** An isolation that records the owner (`scopeId`) and scope each unit runs in. */
function recording(runs: [string | undefined, unknown][]): CallIsolation {
  return {
    run: (actor: Actor, scope: unknown, work: () => Promise<unknown>) => {
      runs.push([actor.scopeId, scope]);
      return work();
    },
  } as unknown as CallIsolation;
}

/** Makes every claim of `store` and `feed` owned by `owner`. */
function own(store: MemoryOutboxDriver, feed: MemoryChangeFeedDriver, owner: string): void {
  const claim = store.claim.bind(store);
  store.claim = async (...args) =>
    (await claim(...args)).map((each) => ({ ...each, ownerId: owner as never }));
  const claimChanges = feed.claim.bind(feed);
  feed.claim = async (...args) =>
    (await claimChanges(...args)).map((each) => ({ ...each, ownerId: owner as never }));
}

describe("OutboxRelayService across owners", () => {
  it("loads, publishes and removes an owned message, and loads owned changes, in its owner", async () => {
    const runs: [string | undefined, unknown][] = [];
    const { relay, store, feed, publisher, batch } = relayOf(new MemoryLockDriver(clock), 0, [
      [CallIsolation, recording(runs)],
    ]);
    own(store, feed, "scp_acme");
    await store.write([eventMessage()]);
    await feed.append([{ change: order("ord_1", "total"), meta: {}, occurredAt: NOON }]);
    await expect(relay.relay()).resolves.toBe(2);
    expect(publisher.published.map((each) => each.id)).toEqual(["evt_A"]);
    expect(store.stored()).toEqual([]);
    expect(batch.batches).toHaveLength(1);
    // load, fan-out with removal, the log's load, then the run as its stored (platform) actor
    expect(runs).toEqual([
      ["scp_acme", undefined],
      ["scp_acme", undefined],
      ["scp_acme", undefined],
      [undefined, undefined],
    ]);
  });

  it("records a failed owned message's retry in its owner", async () => {
    const runs: [string | undefined, unknown][] = [];
    const { relay, store, feed, publisher } = relayOf(new MemoryLockDriver(clock), 0, [
      [CallIsolation, recording(runs)],
    ]);
    own(store, feed, "scp_acme");
    publisher.failing = true;
    await store.write([eventMessage()]);
    await relay.relay();
    expect(store.stored()[0]).toMatchObject({ attempts: 1 });
    expect(runs).toEqual([
      ["scp_acme", undefined],
      ["scp_acme", undefined],
    ]);
  });

  it("refuses an owned message with no isolation bound, never skipping it", async () => {
    const { relay, store, feed, publisher } = relayOf();
    own(store, feed, "scp_acme");
    await store.write([eventMessage()]);
    await expect(relay.relay()).rejects.toBeInstanceOf(RowIsolationMissingError);
    expect(publisher.published).toEqual([]);
    expect(store.stored()).toHaveLength(1);
  });

  it("refuses owned changes with no isolation bound, keeping the cursor", async () => {
    const { relay, store, feed, batch } = relayOf();
    own(store, feed, "scp_acme");
    await feed.append([{ change: order("ord_1", "total"), meta: {}, occurredAt: NOON }]);
    await expect(relay.relay()).rejects.toBeInstanceOf(RowIsolationMissingError);
    expect(batch.batches).toEqual([]);
    await expect(feed.cursor("BatchConsumer")).resolves.toBeUndefined();
  });

  it("refuses a claimed message that does not load, never skipping it", async () => {
    const { relay, store, publisher } = relayOf();
    await store.write([eventMessage()]);
    store.load = async () => undefined;
    await expect(relay.relay()).rejects.toBeInstanceOf(ClaimNotLoadedError);
    expect(publisher.published).toEqual([]);
  });

  it("refuses a claimed change that does not load, keeping the cursor", async () => {
    const { relay, feed, batch } = relayOf();
    await feed.append([{ change: order("ord_1", "total"), meta: {}, occurredAt: NOON }]);
    feed.load = async () => [];
    await expect(relay.relay()).rejects.toBeInstanceOf(ClaimNotLoadedError);
    expect(batch.batches).toEqual([]);
    await expect(feed.cursor("BatchConsumer")).resolves.toBeUndefined();
  });
});
