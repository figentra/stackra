/**
 * Stackra file contract:
 * Purpose: `QueueFake`, the test double of `MutationQueue`: a queue open on a test partition and seeded with waiting
 *          calls and conflicts, bound in place of `MutationQueue` (the render helpers' `queue` option, or
 *          `createTestingModule(...).override(MutationQueue, fake)`), so `useMutationQueue()` reads it unchanged.
 * Boundary: a real `MutationQueue` (so `instanceof` holds and `discard`, `resolve` and `drain` behave as in the app)
 *           over memory storage and the memory seal, the memory platform (online), a leader that always leads, a
 *           sender that never reaches a server (so a drain keeps every call), a fixed device (`fake_device`) and a lock
 *           that never wipes. Seeded synchronously: a test renders it at once.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3: domain fakes in the owning package's `./testing`); ADR 0266 (decision 2:
 *                     a fake per capability).
 */
import { Clock } from "@stackra/contracts";
import { DeviceIdentity } from "@stackra/devices/contracts";
import { MemoryPlatformDriver } from "@stackra/platform";
import { MemoryPayloadSealDriver, MemoryStorageDriver } from "@stackra/storage";

import { MutationSender, QueueLeader } from "#contracts/index";
import { MutationQueue, OfflineLock, QueryConfig, StorageQueryPersisterDriver } from "#core/index";
import type { PendingMutation } from "#react/index";
import type { FakeQueueOptions } from "#testing/types/fake-queue-options.type";

/** One week, the default retention, so a seeded call is never stale during a test. */
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** The device every fake queue runs on. */
const DEVICE = "fake_device";

/** The seeded call number `index`, queued at `now`. */
function seededCall(index: number, now: Date): PendingMutation {
  return Object.freeze({
    id: `fake_mutation_${index}`,
    action: "fake.mutation.queue@1",
    input: {},
    aggregate: `fake_aggregate_${index}`,
    deviceId: DEVICE,
    sequence: null,
    queuedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + WEEK_MS).toISOString(),
  });
}

/**
 * A mutation queue seeded by the test.
 *
 * @example
 * const queue = QueueFake.with({ pending: 2 });
 * queue.pending; // 2
 */
export class QueueFake extends MutationQueue {
  /**
   * A queue not open yet; `QueueFake.with` opens and seeds one. It takes nothing, because a constructor parameter is a
   * DI token (ADR 0294 decision 17).
   */
  constructor() {
    const clock = Object.assign(Object.create(Clock.prototype) as Clock, { now: () => new Date() });
    const leader = Object.assign(Object.create(QueueLeader.prototype) as QueueLeader, {
      isLeader: { get: () => true, subscribe: () => () => undefined },
    });
    const sender = Object.assign(Object.create(MutationSender.prototype) as MutationSender, {
      send: () => Promise.resolve({ ok: false, code: null, server: null }),
    });
    const device = Object.assign(Object.create(DeviceIdentity.prototype) as DeviceIdentity, {
      id: () => Promise.resolve(DEVICE),
    });
    const lock = Object.assign(Object.create(OfflineLock.prototype) as OfflineLock, {
      onWipe: () => () => undefined,
    });
    const storage = new MemoryStorageDriver();
    super(
      new QueryConfig(),
      new StorageQueryPersisterDriver(storage, new MemoryPayloadSealDriver(storage)),
      sender,
      leader,
      new MemoryPlatformDriver(),
      clock,
      device,
      lock,
    );
  }

  /**
   * A queue seeded with waiting calls and conflicts.
   *
   * @param options - how many calls wait and how many conflicts need a person.
   */
  static with(options: FakeQueueOptions = {}): QueueFake {
    const queue = new QueueFake();
    const now = new Date();
    const pending = options.pending ?? 0;
    queue.seed(
      "query.queue.fake",
      DEVICE,
      Array.from({ length: pending }, (_, index) => seededCall(index + 1, now)),
      Array.from({ length: options.conflicts ?? 0 }, (_, index) =>
        Object.freeze({
          ...seededCall(pending + index + 1, now),
          code: "fake_conflict",
          server: null,
          conflictedAt: now.toISOString(),
        }),
      ),
    );
    return queue;
  }
}
