/**
 * Stackra file contract:
 * Purpose: unit tests of `MutationQueue`: closed until opened, refuses an online-only action, queues with a fresh
 *          Idempotency-Key and a capped retention and persists before resolving, restores per partition and keeps
 *          partitions apart, refuses a stored queue it cannot read, replays per aggregate first in first out within
 *          the parallel limit, keeps what did not reach the server, turns a refusal or an expired call into a conflict
 *          that holds its aggregate, drains only while leading and online (on its own when allowed), resolves and
 *          discards conflicts, never keeps a call it could not persist, notifies subscribers, and stops on shutdown.
 * Boundary: test only; storage and the platform are the real memory drivers, the sender, the leader and the clock are
 *           small classes of their ports, and the offline map restates the template's console entries.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0059 (decisions 2 and 3); ADR 0252 (decision 2); ADR 0138.
 */
import { ConflictResolution, IdMinting, OfflineMode, OfflinePrecondition } from "@stackra/actions";
import { buildConfig } from "@stackra/config";
import type { ConfigValues } from "@stackra/config";
import { Service } from "@stackra/container";
import { Clock } from "@stackra/contracts";
import type { Json } from "@stackra/contracts";
import { MemoryPlatformDriver } from "@stackra/platform";
import { MemoryStorageDriver } from "@stackra/storage";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { QueryConfig } from "#config/query.config";
import { MutationSender } from "#contracts/ports/mutation-sender.port";
import { QueueLeader } from "#contracts/ports/queue-leader.port";
import type { ReplayOutcome } from "#contracts/types/replay-outcome.type";
import { StorageQueryPersisterDriver } from "#core/drivers/storage-query-persister.driver";
import { OfflineError } from "#core/errors/offline.error";
import { offlineMap } from "#core/functions/offline-map.function";
import { MutationQueue } from "#core/services/mutation-queue.service";

class CreateOrderAction {
  static readonly key = "orders.order.create@1";
}

class ArchiveProductAction {
  static readonly key = "catalogue.product.archive@1";
}

class CancelOrderAction {
  static readonly key = "orders.order.cancel@1";
}

offlineMap([
  {
    action: CreateOrderAction,
    mode: OfflineMode.Queue,
    idMinting: IdMinting.Client,
    precondition: OfflinePrecondition.None,
    retention: "72h",
    onConflict: [ConflictResolution.ServerWins, ConflictResolution.Manual],
  },
  {
    action: ArchiveProductAction,
    mode: OfflineMode.Queue,
    idMinting: IdMinting.Server,
    precondition: OfflinePrecondition.Version,
    retention: "24h",
    onConflict: [
      ConflictResolution.ServerWins,
      ConflictResolution.ClientRetry,
      ConflictResolution.Manual,
    ],
  },
]);

const NOW = new Date("2026-10-24T09:00:00.000Z");

const HOUR_MS = 60 * 60 * 1000;

const USER = { principal: "usr_1", scope: { id: "scp_wsp1", path: "platform.wsp1" } } as const;

const KEY = "query.queue.usr_1.scp_wsp1";

const OK: ReplayOutcome = { ok: true, code: null, server: null };

const NOT_REACHED: ReplayOutcome = { ok: false, code: null, server: null };

/** A clock a test moves by setting `at`. */
class TestClock extends Clock {
  at = NOW.getTime();

  now(): Date {
    return new Date(this.at);
  }
}

/** A leader a test switches with `set`. */
class TestLeader extends QueueLeader {
  private value: boolean;

  private readonly listeners = new Set<(value: boolean) => void>();

  readonly isLeader = {
    get: () => this.value,
    subscribe: (listener: (value: boolean) => void) => {
      this.listeners.add(listener);
      return () => {
        this.listeners.delete(listener);
      };
    },
  };

  constructor(value: boolean) {
    super();
    this.value = value;
  }

  set(value: boolean): void {
    this.value = value;
    for (const listener of this.listeners) listener(value);
  }
}

/** A sender that records each call and answers with `answer`. */
class ScriptedSender extends MutationSender {
  readonly sent: { readonly action: string; readonly input: Json; readonly key: string }[] = [];

  answer: (action: string, input: Json) => Promise<ReplayOutcome> = () => Promise.resolve(OK);

  send(action: string, input: Json, idempotencyKey: string): Promise<ReplayOutcome> {
    this.sent.push({ action, input, key: idempotencyKey });
    return this.answer(action, input);
  }
}

/** The settings of one test queue. */
interface Setup {
  readonly online?: boolean;
  readonly leads?: boolean;
  readonly values?: Partial<ConfigValues<QueryConfig>>;
  readonly storage?: MemoryStorageDriver;
}

/** A queue over memory storage, opened for `USER`. */
async function queueOf(setup: Setup = {}) {
  const storage = setup.storage ?? new MemoryStorageDriver();
  const persister = new StorageQueryPersisterDriver(storage);
  const sender = new ScriptedSender();
  const leader = new TestLeader(setup.leads ?? true);
  const platform = new MemoryPlatformDriver().configure({
    network: { isOnline: setup.online ?? false },
  });
  const clock = new TestClock();
  const config = buildConfig(QueryConfig, { values: setup.values ?? {} });
  const queue = new MutationQueue(config, persister, sender, leader, platform, clock);
  await queue.open(USER);
  return { queue, storage, persister, sender, leader, platform, clock };
}

describe("MutationQueue", () => {
  it("is a service that is closed until opened", async () => {
    const queue = new MutationQueue(
      buildConfig(QueryConfig),
      new StorageQueryPersisterDriver(new MemoryStorageDriver()),
      new ScriptedSender(),
      new TestLeader(true),
      new MemoryPlatformDriver(),
      new TestClock(),
    );
    expect(queue).toBeInstanceOf(Service);
    await expect(queue.enqueue(CreateOrderAction, {})).rejects.toThrow(TypeError);
    await queue.open(USER);
    expect(queue.pending).toBe(0);
    expect(queue.conflicts).toEqual([]);
  });

  it("refuses an online-only action with OfflineError, storing nothing", async () => {
    const { queue, storage } = await queueOf();
    await expect(queue.enqueue(CancelOrderAction, {})).rejects.toThrow(OfflineError);
    await expect(queue.enqueue("orders.order.cancel@1", {})).rejects.toThrow(OfflineError);
    expect(queue.pending).toBe(0);
    expect(storage.outbox.keys()).toEqual([]);
  });

  it("queues a call with a fresh key and the declared retention, persisted before it resolves", async () => {
    const { queue, storage } = await queueOf();
    const entry = await queue.enqueue(CreateOrderAction, { total: 3 }, "ord_1");
    expect(entry).toEqual({
      id: expect.stringMatching(/^[0-9a-f-]{36}$/),
      action: "orders.order.create@1",
      input: { total: 3 },
      aggregate: "ord_1",
      queuedAt: NOW.toISOString(),
      expiresAt: new Date(NOW.getTime() + 72 * HOUR_MS).toISOString(),
    });
    expect((await queue.enqueue(CreateOrderAction, {})).id).not.toBe(entry.id);
    expect(queue.pending).toBe(2);
    expect(queue.items[0]).toBe(entry);
    expect(storage.outbox.get(KEY)).toEqual({
      version: 1,
      items: queue.items,
      conflicts: [],
    });
  });

  it("caps the declared retention at queueRetentionDays", async () => {
    const { queue } = await queueOf({ values: { queueRetentionDays: 1 } });
    const entry = await queue.enqueue(CreateOrderAction, {});
    expect(entry.expiresAt).toBe(new Date(NOW.getTime() + 24 * HOUR_MS).toISOString());
  });

  it("restores the persisted queue when it opens and keeps partitions apart", async () => {
    const storage = new MemoryStorageDriver();
    const first = await queueOf({ storage });
    const entry = await first.queue.enqueue(CreateOrderAction, { total: 1 });
    const second = await queueOf({ storage });
    expect(second.queue.items).toEqual([entry]);
    await second.queue.open({ principal: "usr_2", scope: USER.scope });
    expect(second.queue.pending).toBe(0);
    await second.queue.open({
      principal: "usr_1",
      scope: { id: "scp_wsp2", path: "platform.wsp2" },
    });
    expect(second.queue.pending).toBe(0);
    await second.queue.open(USER);
    expect(second.queue.items).toEqual([entry]);
  });

  it("refuses to open a stored queue it cannot read and leaves it untouched", async () => {
    const storage = new MemoryStorageDriver();
    storage.outbox.set(KEY, { version: 2, entries: [] });
    await expect(queueOf({ storage })).rejects.toThrow(TypeError);
    expect(storage.outbox.get(KEY)).toEqual({ version: 2, entries: [] });
  });

  it("replays each aggregate first in first out once the network returns", async () => {
    const { queue, sender, platform, storage } = await queueOf();
    const first = await queue.enqueue(CreateOrderAction, { n: 1 }, "ord_1");
    const other = await queue.enqueue(CreateOrderAction, { n: 2 }, "ord_2");
    const second = await queue.enqueue(ArchiveProductAction, { n: 3 }, "ord_1");
    expect(sender.sent).toEqual([]);
    platform.network.isOnline.set(true);
    await queue.drain();
    const keys = sender.sent.map((call) => call.key);
    expect(keys).toEqual(expect.arrayContaining([first.id, other.id, second.id]));
    expect(keys.indexOf(first.id)).toBeLessThan(keys.indexOf(second.id));
    expect(sender.sent.find((call) => call.key === second.id)?.action).toBe(
      "catalogue.product.archive@1",
    );
    expect(queue.pending).toBe(0);
    expect(storage.outbox.get(KEY)).toEqual({ version: 1, items: [], conflicts: [] });
  });

  it("replays at most maxParallelAggregates aggregates at once", async () => {
    const { queue, sender, platform } = await queueOf({ values: { maxParallelAggregates: 2 } });
    for (const aggregate of ["ord_1", "ord_2", "ord_3"])
      await queue.enqueue(CreateOrderAction, {}, aggregate);
    let active = 0;
    let peak = 0;
    sender.answer = async () => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 0));
      active -= 1;
      return OK;
    };
    platform.network.isOnline.set(true);
    await queue.drain();
    expect(sender.sent).toHaveLength(3);
    expect(peak).toBe(2);
  });

  it("keeps a call that did not reach the server and stops its aggregate", async () => {
    const { queue, sender, platform } = await queueOf();
    await queue.enqueue(CreateOrderAction, {}, "ord_1");
    await queue.enqueue(CreateOrderAction, {}, "ord_1");
    sender.answer = () => Promise.resolve(NOT_REACHED);
    platform.network.isOnline.set(true);
    await queue.drain();
    expect(sender.sent).toHaveLength(1);
    sender.answer = () => Promise.reject(new Error("socket closed"));
    await queue.drain();
    expect(sender.sent).toHaveLength(2);
    expect(queue.pending).toBe(2);
    expect(queue.conflicts).toEqual([]);
  });

  it("turns a refusal into a conflict holding the server state and holds its aggregate behind it", async () => {
    const { queue, sender, platform, storage } = await queueOf();
    const refused = await queue.enqueue(ArchiveProductAction, { n: 1 }, "prd_1");
    const behind = await queue.enqueue(ArchiveProductAction, { n: 2 }, "prd_1");
    const elsewhere = await queue.enqueue(CreateOrderAction, { n: 3 }, "ord_1");
    sender.answer = (_action, input) =>
      Promise.resolve(
        (input as { n: number }).n === 1
          ? { ok: false, code: "version_conflict", server: { version: 3 } }
          : OK,
      );
    platform.network.isOnline.set(true);
    await queue.drain();
    expect(queue.conflicts).toEqual([
      {
        ...refused,
        code: "version_conflict",
        server: { version: 3 },
        conflictedAt: NOW.toISOString(),
      },
    ]);
    expect(queue.items).toEqual([behind]);
    expect(sender.sent.map((call) => call.key)).toEqual(
      expect.arrayContaining([refused.id, elsewhere.id]),
    );
    expect(sender.sent.map((call) => call.key)).not.toContain(behind.id);
    await queue.drain();
    expect(sender.sent.map((call) => call.key)).not.toContain(behind.id);
    expect(storage.outbox.get(KEY)).toEqual({
      version: 1,
      items: [behind],
      conflicts: queue.conflicts,
    });
  });

  it("turns a call past its retention into a stale_offline_mutation conflict without sending it", async () => {
    const { queue, sender, platform, clock } = await queueOf();
    await queue.enqueue(ArchiveProductAction, {}, "prd_1");
    clock.at += 25 * HOUR_MS;
    platform.network.isOnline.set(true);
    await queue.drain();
    expect(sender.sent).toEqual([]);
    expect(queue.conflicts[0]).toMatchObject({ code: "stale_offline_mutation", server: null });
    expect(queue.pending).toBe(0);
  });

  it("drains only while leading and online, and on its own when either turns on", async () => {
    const { queue, sender, leader } = await queueOf({ online: true, leads: false });
    await queue.enqueue(CreateOrderAction, {});
    await queue.drain();
    expect(sender.sent).toEqual([]);
    leader.set(true);
    await queue.drain();
    expect(sender.sent).toHaveLength(1);
    expect(queue.pending).toBe(0);
  });

  it("waits for drain() when it does not replay on its own", async () => {
    const { queue, sender, platform } = await queueOf({ values: { replayOnReconnect: false } });
    await queue.enqueue(CreateOrderAction, {});
    platform.network.isOnline.set(true);
    await Promise.resolve();
    expect(sender.sent).toEqual([]);
    await queue.drain();
    expect(sender.sent).toHaveLength(1);
  });

  it("resolves conflicts: manual leaves it, client_retry requeues with a new key, server_wins drops it", async () => {
    const { queue, sender, platform } = await queueOf({ online: true });
    sender.answer = () => Promise.resolve({ ok: false, code: "version_conflict", server: null });
    await queue.enqueue(ArchiveProductAction, {}, "prd_1");
    await queue.enqueue(ArchiveProductAction, {}, "prd_2");
    await queue.drain();
    const [retried, dropped] = queue.conflicts;
    if (retried === undefined || dropped === undefined) throw new Error("two conflicts expected");
    await queue.resolve(retried.id, ConflictResolution.Manual);
    expect(queue.conflicts).toHaveLength(2);
    sender.answer = () => Promise.resolve(OK);
    await queue.resolve(retried.id, ConflictResolution.ClientRetry);
    await queue.drain();
    const retry = sender.sent.at(-1);
    expect(retry?.action).toBe(retried.action);
    expect(retry?.key).not.toBe(retried.id);
    const sentBefore = sender.sent.length;
    await queue.resolve(dropped.id, ConflictResolution.ServerWins);
    await queue.drain();
    expect(sender.sent).toHaveLength(sentBefore);
    expect(queue.conflicts).toEqual([]);
    expect(queue.pending).toBe(0);
    expect(platform.network.isOnline.get()).toBe(true);
  });

  it("refuses client_retry for an action that does not offer it", async () => {
    const { queue, sender } = await queueOf({ online: true });
    sender.answer = () => Promise.resolve({ ok: false, code: "forbidden", server: null });
    await queue.enqueue(CreateOrderAction, {});
    await queue.drain();
    const [conflict] = queue.conflicts;
    if (conflict === undefined) throw new Error("a conflict expected");
    await expect(queue.resolve(conflict.id, ConflictResolution.ClientRetry)).rejects.toThrow(
      RangeError,
    );
    expect(queue.conflicts).toEqual([conflict]);
    await queue.resolve("unknown", ConflictResolution.ServerWins);
    expect(queue.conflicts).toEqual([conflict]);
  });

  it("discards a waiting call or a conflict, which unblocks its aggregate", async () => {
    const { queue, sender, platform } = await queueOf();
    const waiting = await queue.enqueue(CreateOrderAction, {}, "ord_9");
    await queue.discard(waiting.id);
    expect(queue.pending).toBe(0);
    const refused = await queue.enqueue(CreateOrderAction, { n: 1 }, "ord_1");
    const behind = await queue.enqueue(CreateOrderAction, { n: 2 }, "ord_1");
    sender.answer = (_action, input) =>
      Promise.resolve(
        (input as { n: number }).n === 1 ? { ok: false, code: "forbidden", server: null } : OK,
      );
    platform.network.isOnline.set(true);
    await queue.drain();
    expect(queue.items).toEqual([behind]);
    await queue.discard(refused.id);
    await queue.drain();
    expect(sender.sent.map((call) => call.key)).toContain(behind.id);
    expect(queue.pending).toBe(0);
    expect(queue.conflicts).toEqual([]);
    await queue.discard("unknown");
  });

  it("does not keep a call it could not persist", async () => {
    const { queue, persister } = await queueOf();
    vi.spyOn(persister, "write").mockRejectedValueOnce(new Error("quota exceeded"));
    await expect(queue.enqueue(CreateOrderAction, {})).rejects.toThrow("quota exceeded");
    expect(queue.pending).toBe(0);
  });

  it("notifies subscribers, moves its version and shows isDraining while replaying", async () => {
    const { queue, sender, platform } = await queueOf();
    const seen: number[] = [];
    const stop = queue.subscribe(() => seen.push(queue.pending));
    const before = queue.version();
    await queue.enqueue(CreateOrderAction, {});
    expect(seen).toContain(1);
    expect(queue.version()).toBeGreaterThan(before);
    let drainingDuringSend = false;
    sender.answer = () => {
      drainingDuringSend = queue.isDraining;
      return Promise.resolve(OK);
    };
    platform.network.isOnline.set(true);
    await queue.drain();
    expect(drainingDuringSend).toBe(true);
    expect(queue.isDraining).toBe(false);
    stop();
    const count = seen.length;
    await queue.enqueue(CreateOrderAction, {});
    expect(seen).toHaveLength(count);
  });

  it("stops listening to the network and the leader on shutdown", async () => {
    const { queue, sender, platform } = await queueOf();
    await queue.enqueue(CreateOrderAction, {});
    queue.onApplicationShutdown();
    platform.network.isOnline.set(true);
    await Promise.resolve();
    expect(sender.sent).toEqual([]);
  });
});
