/**
 * Stackra file contract:
 * Purpose: unit tests of `LocksCacheLockDriver`: it is a driver of @stackra/cache's `CacheLock` port, it runs a fill
 *          when the key is free and answers `true`, answers `false` at once without running while another fill holds
 *          the key, frees the key when the fill ends (also when it rejects), and passes a rejection through.
 * Boundary: test only; `Locks` runs over the real memory lock driver with a fixed clock.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0150 (decision 4); ADR
 *                     0149 (decision 2).
 */
import { CacheLock } from "@stackra/cache/contracts";
import { Clock, Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { LocksCacheLockDriver } from "#core/drivers/locks-cache-lock.driver";
import { MemoryLockDriver } from "#core/drivers/memory-lock.driver";
import { Locks } from "#core/services/locks.service";

class FixedClock extends Clock {
  now(): Date {
    return new Date("2026-10-28T09:00:00.000Z");
  }
}

const TTL = Duration.seconds(5);

/** A driver over fresh memory locks. */
function setup(): LocksCacheLockDriver {
  const clock = new FixedClock();
  return new LocksCacheLockDriver(new Locks(new MemoryLockDriver(clock), clock));
}

/** Stands in for `resolve` until the promise executor sets it. */
const UNSET = (): void => undefined;

describe(LocksCacheLockDriver, () => {
  it("is a driver of the CacheLock port", () => {
    expect(setup()).toBeInstanceOf(CacheLock);
  });

  it("runs a fill on a free key and answers true", async () => {
    const lock = setup();
    const work = vi.fn(async () => undefined);
    await expect(lock.tryWith("cache.fill:/Product:prd_1", TTL, work)).resolves.toBe(true);
    expect(work).toHaveBeenCalledOnce();
  });

  it("answers false at once while another fill holds the key, and frees it when that fill ends", async () => {
    const lock = setup();
    let release = UNSET;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    const first = lock.tryWith("cache.fill:/Product:prd_1", TTL, () => held);
    const second = vi.fn(async () => undefined);
    await expect(lock.tryWith("cache.fill:/Product:prd_1", TTL, second)).resolves.toBe(false);
    expect(second).not.toHaveBeenCalled();
    await expect(lock.tryWith("cache.fill:/Product:prd_2", TTL, second)).resolves.toBe(true);
    release();
    await expect(first).resolves.toBe(true);
    await expect(lock.tryWith("cache.fill:/Product:prd_1", TTL, second)).resolves.toBe(true);
  });

  it("passes a rejected fill through and frees the key", async () => {
    const lock = setup();
    const failure = new Error("database down");
    await expect(
      lock.tryWith("cache.fill:/Product:prd_1", TTL, () => Promise.reject(failure)),
    ).rejects.toBe(failure);
    await expect(
      lock.tryWith("cache.fill:/Product:prd_1", TTL, async () => undefined),
    ).resolves.toBe(true);
  });
});
