/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryLockDriver`: every key or none taken, disjoint keys side by side, increasing tokens,
 *          expiry on the clock, renewal pushing the expiry, a lapsed lease that can neither renew nor free the key of
 *          the lease that took it since, release, and `within` running the work as it is.
 * Boundary: test only; a settable clock drives expiry.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0103 (decision 2);
 *                     ADR 0149 (decisions 2 and 3).
 */
import { Clock, Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { LockDriver } from "#contracts/index";
import type { LockLease } from "#contracts/index";
import { MemoryLockDriver } from "#core/drivers/memory-lock.driver";

class ManualClock extends Clock {
  time = Date.parse("2026-10-24T09:00:00.000Z");

  now(): Date {
    return new Date(this.time);
  }
}

const TTL = Duration.seconds(10);

/** The lease `driver` gives `owner` on `keys`; the test fails when one is held. */
async function take(
  driver: MemoryLockDriver,
  keys: readonly string[],
  owner: string,
): Promise<LockLease> {
  const lease = await driver.tryAcquire(keys, owner, TTL);
  if (lease === undefined) throw new Error(`${keys.join(", ")} is held`);
  return lease;
}

/** A driver with its clock. */
function setup(): { driver: MemoryLockDriver; clock: ManualClock } {
  const clock = new ManualClock();
  return { driver: new MemoryLockDriver(clock), clock };
}

describe(MemoryLockDriver, () => {
  it("is a LockDriver whose within runs the work as it is", async () => {
    const { driver } = setup();
    expect(driver).toBeInstanceOf(LockDriver);
    await expect(driver.within(async () => 42)).resolves.toBe(42);
  });

  it("takes every key or none, and disjoint keys side by side", async () => {
    const { driver } = setup();
    const first = await driver.tryAcquire(["a", "b"], "one", TTL);
    expect(first).toEqual({ keys: ["a", "b"], owner: "one", token: 1 });
    await expect(driver.tryAcquire(["b", "c"], "two", TTL)).resolves.toBeUndefined();
    // "c" was not taken by the refused call.
    await expect(driver.tryAcquire(["c"], "two", TTL)).resolves.toEqual({
      keys: ["c"],
      owner: "two",
      token: 2,
    });
  });

  it("frees the keys on release", async () => {
    const { driver } = setup();
    await driver.release(await take(driver, ["a"], "one"));
    await expect(driver.tryAcquire(["a"], "two", TTL)).resolves.toMatchObject({ token: 2 });
  });

  it("lets a lease lapse at its ttl, and the next one gets a larger token", async () => {
    const { driver, clock } = setup();
    const stale = await take(driver, ["a"], "one");
    clock.time += 9999;
    await expect(driver.tryAcquire(["a"], "two", TTL)).resolves.toBeUndefined();
    clock.time += 1;
    const fresh = await take(driver, ["a"], "two");
    expect(fresh.token).toBeGreaterThan(stale.token);
    await expect(driver.renew(stale, TTL)).resolves.toBe(false);
    await driver.release(stale);
    await expect(driver.tryAcquire(["a"], "three", TTL)).resolves.toBeUndefined();
  });

  it("keeps a renewed lease past its first ttl", async () => {
    const { driver, clock } = setup();
    const lease = await take(driver, ["a", "b"], "one");
    clock.time += 6000;
    await expect(driver.renew(lease, TTL)).resolves.toBe(true);
    clock.time += 6000;
    await expect(driver.tryAcquire(["b"], "two", TTL)).resolves.toBeUndefined();
    clock.time += 4000;
    await expect(driver.renew(lease, TTL)).resolves.toBe(false);
    await expect(driver.tryAcquire(["b"], "two", TTL)).resolves.toMatchObject({ keys: ["b"] });
  });

  it("gives an empty key list a lease that holds nothing", async () => {
    const { driver } = setup();
    await expect(driver.tryAcquire([], "one", TTL)).resolves.toEqual({
      keys: [],
      owner: "one",
      token: 1,
    });
    await expect(driver.tryAcquire([], "two", TTL)).resolves.toMatchObject({ token: 2 });
  });
});
