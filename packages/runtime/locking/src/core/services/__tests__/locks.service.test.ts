/**
 * Stackra file contract:
 * Purpose: unit tests of `Locks`: `with` holds the keys sorted and each once inside the driver's `within`, waits for a
 *          held key and runs once it is free, refuses `lock_unavailable` after waiting the TTL, renews the lease so long
 *          work outlives its TTL, and releases however the work ends; `tryWith` runs only when the keys are free and
 *          never waits; every lease carries its `Locks`' owner; a zero TTL is a `RangeError`.
 * Boundary: test only; the memory driver, wrapped to record each call, over a host-time clock that vitest's fake
 *           timers move.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing, `vi` from vitest); ADR 0103
 *                     (decision 1); ADR 0149 (decisions 2 and 3).
 */
import { Clock, Duration } from "@stackra/contracts";
import { isRefusal } from "@stackra/errors";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import type { LockLease } from "#contracts/index";
import { MemoryLockDriver } from "#core/drivers/memory-lock.driver";
import { LockUnavailableError } from "#core/errors/lock-unavailable.error";
import { Locks } from "#core/services/locks.service";

/** Reads the host clock, which vitest's fake timers move. */
class TimerClock extends Clock {
  now(): Date {
    return new Date();
  }
}

/** The memory driver, recording what `Locks` asks of it. */
class RecordingLockDriver extends MemoryLockDriver {
  readonly calls: string[] = [];

  override within<T>(work: () => Promise<T>): Promise<T> {
    this.calls.push("within");
    return super.within(work);
  }

  override tryAcquire(
    keys: readonly string[],
    owner: string,
    ttl: Duration,
  ): Promise<LockLease | undefined> {
    this.calls.push(`try ${keys.join(",")}`);
    return super.tryAcquire(keys, owner, ttl);
  }

  override renew(lease: LockLease, ttl: Duration): Promise<boolean> {
    this.calls.push(`renew ${lease.token}`);
    return super.renew(lease, ttl);
  }

  override release(lease: LockLease): Promise<void> {
    this.calls.push(`release ${lease.token}`);
    return super.release(lease);
  }
}

/** A promise the test resolves when it chooses. */
function deferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve: (() => void) | undefined;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve: () => resolve?.() };
}

const TTL = Duration.seconds(3);

/** `Locks` over a recording memory driver. */
function setup(): { driver: RecordingLockDriver; locks: Locks } {
  const clock = new TimerClock();
  const driver = new RecordingLockDriver(clock);
  return { driver, locks: new Locks(driver, clock) };
}

describe(Locks, () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: Date.parse("2026-10-24T09:00:00.000Z") });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("runs the work holding the keys sorted and each once, then releases them", async () => {
    const { driver, locks } = setup();
    const result = await locks.with(["b", "a", "b"], TTL, async (lease) => {
      expect(lease).toEqual({ keys: ["a", "b"], owner: locks.owner, token: 1 });
      await expect(driver.tryAcquire(["a"], "other", TTL)).resolves.toBeUndefined();
      return "done";
    });
    expect(result).toBe("done");
    expect(driver.calls).toEqual(["within", "try a,b", "try a", "release 1"]);
    await expect(driver.tryAcquire(["a", "b"], "other", TTL)).resolves.toMatchObject({ token: 2 });
  });

  it("gives every lease the owner of its Locks, one per instance", async () => {
    const { locks } = setup();
    const { locks: elsewhere } = setup();
    expect(locks.owner).toMatch(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/);
    expect(elsewhere.owner).not.toBe(locks.owner);
    await expect(locks.with("a", TTL, async (lease) => lease.owner)).resolves.toBe(locks.owner);
  });

  it("waits for a held key and runs once it is free", async () => {
    const { locks } = setup();
    const order: string[] = [];
    const gate = deferred();
    const first = locks.with("a", TTL, async () => {
      order.push("first in");
      await gate.promise;
      order.push("first out");
    });
    const second = locks.with("a", TTL, async () => {
      order.push("second");
    });
    await vi.advanceTimersByTimeAsync(100);
    expect(order).toEqual(["first in"]);
    gate.resolve();
    await first;
    await vi.advanceTimersByTimeAsync(200);
    await second;
    expect(order).toEqual(["first in", "first out", "second"]);
  });

  it("refuses lock_unavailable when a key stays held for the whole ttl, without running the work", async () => {
    const { driver, locks } = setup();
    await driver.tryAcquire(["a"], "other", Duration.minutes(1));
    const work = vi.fn(async () => {});
    const refused = locks.with("a", TTL, work).catch((error: unknown) => error);
    await vi.advanceTimersByTimeAsync(3_200);
    expect(isRefusal(await refused, LockUnavailableError)).toBe(true);
    expect(work).not.toHaveBeenCalled();
  });

  it("renews the lease every third of the ttl, so long work outlives it", async () => {
    const { driver, locks } = setup();
    const gate = deferred();
    const running = locks.with("a", TTL, () => gate.promise);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(driver.calls.filter((call) => call.startsWith("renew"))).toHaveLength(10);
    await expect(driver.tryAcquire(["a"], "other", TTL)).resolves.toBeUndefined();
    gate.resolve();
    await running;
    expect(driver.calls.at(-1)).toBe("release 1");
    await vi.advanceTimersByTimeAsync(10_000);
    expect(driver.calls.filter((call) => call.startsWith("renew"))).toHaveLength(10);
    await expect(driver.tryAcquire(["a"], "other", TTL)).resolves.toMatchObject({ keys: ["a"] });
  });

  it("releases the lease when the work throws, and passes the error on", async () => {
    const { driver, locks } = setup();
    const failure = new Error("work failed");
    await expect(
      locks.with("a", TTL, async () => {
        throw failure;
      }),
    ).rejects.toBe(failure);
    expect(driver.calls.at(-1)).toBe("release 1");
  });

  it("runs tryWith's work only when the keys are free, and never waits", async () => {
    const { driver, locks } = setup();
    const work = vi.fn(async (_lease: LockLease) => {});
    await expect(locks.tryWith("job", TTL, work)).resolves.toBe(true);
    expect(work).toHaveBeenCalledWith({ keys: ["job"], owner: locks.owner, token: 1 });
    await driver.tryAcquire(["job"], "other", TTL);
    await expect(locks.tryWith("job", TTL, work)).resolves.toBe(false);
    expect(work).toHaveBeenCalledTimes(1);
    expect(driver.calls.filter((call) => call === "try job")).toHaveLength(3);
  });

  it("refuses a zero ttl", () => {
    const { locks } = setup();
    expect(() => locks.with("a", Duration.seconds(0), async () => {})).toThrow(RangeError);
    expect(() => locks.tryWith("a", Duration.seconds(0), async () => {})).toThrow(RangeError);
  });
});
