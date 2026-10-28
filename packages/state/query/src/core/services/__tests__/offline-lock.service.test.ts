/**
 * Stackra file contract:
 * Purpose: unit tests of `OfflineLock`: a revoke wipes the `outbox`, `cache` and `secrets` areas after every wipe
 *          listener settled and locks until a sign-in; the offline limit (24 hours by default) passed without a sync
 *          wipes and ends the session, while a sync in time records its time and the last acknowledged sequence and
 *          never wipes; a wipe restarts the countdown; `start` runs once; shutdown stops the watching.
 * Boundary: test only; storage, the platform and the settings store are the real memory drivers, and the session, the
 *           reader, the device and the clock are small classes of their ports.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0338 (decisions 2 and 4).
 */
import { Service } from "@stackra/container";
import { Clock } from "@stackra/contracts";
import { DeviceIdentity } from "@stackra/devices/contracts";
import { MemoryPlatformDriver } from "@stackra/platform";
import { MemorySettingValueStoreDriver, SettingsReader } from "@stackra/settings";
import { MemoryStorageDriver } from "@stackra/storage";
import { describe, expect, it } from "@stackra/testing";

import { AcknowledgementReader } from "#contracts/ports/acknowledgement-reader.port";
import { OfflineSession } from "#contracts/ports/offline-session.port";
import { OfflineLock } from "#core/services/offline-lock.service";

const NOW = new Date("2026-10-24T09:00:00.000Z");

const HOUR_MS = 60 * 60 * 1000;

/** A clock a test moves by setting `at`. */
class TestClock extends Clock {
  at = NOW.getTime();

  now(): Date {
    return new Date(this.at);
  }
}

/** A boolean signal a test switches with `set`. */
function flag(initial: boolean) {
  let value = initial;
  const listeners = new Set<(value: boolean) => void>();
  return {
    get: () => value,
    set: (next: boolean) => {
      value = next;
      for (const listener of listeners) listener(next);
    },
    subscribe: (listener: (value: boolean) => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/** A session a test revokes and signs in; `ended` counts the local sign-outs. */
class TestSession extends OfflineSession {
  readonly isRevoked = flag(false);

  readonly isSignedIn = flag(true);

  ended = 0;

  end(): Promise<void> {
    this.ended += 1;
    this.isSignedIn.set(false);
    return Promise.resolve();
  }
}

/** A reader that answers `sequence`, or fails while `fails`. */
class TestReader extends AcknowledgementReader {
  fails = false;

  asked: string[] = [];

  lastAcknowledged(deviceId: string): Promise<number | null> {
    this.asked.push(deviceId);
    return this.fails ? Promise.reject(new Error("offline")) : Promise.resolve(7);
  }
}

/** The device of every test. */
class TestDevice extends DeviceIdentity {
  id(): Promise<string> {
    return Promise.resolve("device-1");
  }
}

/** Lets the lock's chained promises settle. */
const settle = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

/** A lock over memory storage holding something in each area it wipes. */
function lockOf(online = true) {
  const storage = new MemoryStorageDriver();
  for (const area of [storage.outbox, storage.cache, storage.secrets]) area.set("held", "data");
  const session = new TestSession();
  const reader = new TestReader();
  const platform = new MemoryPlatformDriver().configure({ network: { isOnline: online } });
  const clock = new TestClock();
  const lock = new OfflineLock(
    storage,
    session,
    reader,
    new TestDevice(),
    new SettingsReader(new MemorySettingValueStoreDriver()),
    platform,
    clock,
  );
  return { lock, storage, session, reader, platform, clock };
}

/** Whether every area the lock wipes is empty. */
const isWiped = (storage: MemoryStorageDriver) =>
  [storage.outbox, storage.cache, storage.secrets].every((area) => area.keys().length === 0);

describe("OfflineLock", () => {
  it("is a service that syncs on start: it records the sync and the last acknowledged sequence", async () => {
    const { lock, reader, clock } = lockOf();
    expect(lock).toBeInstanceOf(Service);
    expect(lock.lastSyncedAt).toBeNull();
    lock.start();
    lock.start();
    await settle();
    expect(reader.asked).toEqual(["device-1"]);
    expect(lock.lastAcknowledged).toBe(7);
    expect(lock.lastSyncedAt).toEqual(new Date(clock.at));
    expect(lock.isLocked).toBe(false);
    lock.onApplicationShutdown();
  });

  it("wipes on revoke after every listener settled, and locks until someone signs in", async () => {
    const { lock, storage, session } = lockOf();
    lock.start();
    await settle();
    const order: string[] = [];
    lock.onWipe(async () => {
      await settle();
      order.push(isWiped(storage) ? "after" : "before");
    });
    lock.onWipe(() => Promise.reject(new Error("a listener failed")));
    session.isSignedIn.set(false);
    session.isRevoked.set(true);
    await settle();
    await settle();
    expect(order).toEqual(["before"]);
    expect(isWiped(storage)).toBe(true);
    expect(lock.isLocked).toBe(true);
    expect(lock.lastSyncedAt).toBeNull();
    expect(session.ended).toBe(0);
    session.isSignedIn.set(true);
    expect(lock.isLocked).toBe(false);
    await settle();
    lock.onApplicationShutdown();
  });

  it("wipes and ends the session when the offline limit passes without a sync", async () => {
    const { lock, storage, session, reader, clock } = lockOf(false);
    lock.start();
    await settle();
    expect(reader.asked).toEqual([]);
    reader.fails = true;
    clock.at += 23 * HOUR_MS;
    await lock.check();
    expect(isWiped(storage)).toBe(false);
    clock.at += 2 * HOUR_MS;
    await lock.check();
    expect(isWiped(storage)).toBe(true);
    expect(lock.isLocked).toBe(true);
    expect(session.ended).toBe(1);
    lock.onApplicationShutdown();
  });

  it("never wipes past the limit when a sync succeeds then, and restarts the countdown", async () => {
    const { lock, storage, session, clock } = lockOf(false);
    lock.start();
    await settle();
    clock.at += 25 * HOUR_MS;
    await lock.check();
    expect(isWiped(storage)).toBe(false);
    expect(session.ended).toBe(0);
    expect(lock.lastSyncedAt).toEqual(new Date(clock.at));
    lock.onApplicationShutdown();
  });

  it("restarts the countdown after a wipe, so a failed sync right after signing in keeps the new data", async () => {
    const { lock, storage, session, reader, clock } = lockOf(false);
    lock.start();
    await settle();
    reader.fails = true;
    clock.at += 25 * HOUR_MS;
    await lock.check();
    expect(session.ended).toBe(1);
    storage.outbox.set("queue", "sealed");
    session.isSignedIn.set(true);
    await settle();
    expect(lock.isLocked).toBe(false);
    expect(storage.outbox.get("queue")).toBe("sealed");
    expect(session.ended).toBe(1);
    lock.onApplicationShutdown();
  });

  it("wipes on start when the session is already revoked, and stops watching on shutdown", async () => {
    const started = lockOf();
    started.session.isRevoked.set(true);
    started.lock.start();
    await settle();
    expect(isWiped(started.storage)).toBe(true);
    started.lock.onApplicationShutdown();
    const stopped = lockOf();
    stopped.lock.start();
    await settle();
    stopped.lock.onApplicationShutdown();
    stopped.session.isRevoked.set(true);
    await settle();
    expect(isWiped(stopped.storage)).toBe(false);
  });
});
