/**
 * Stackra file contract:
 * Purpose: integration tests of `ValkeyLockDriver` on a real Valkey: its three Lua scripts as the server runs them. A
 *          lease takes every key or none, stores `<owner>:<token>` with its TTL and draws tokens that only grow; a key
 *          frees itself when its TTL lapses; `renew` and `release` act only while every key still holds the lease's
 *          value, so a lapsed holder never extends or frees its successor's lock; and `Locks` over two drivers (two
 *          instances of a service) serialises a read-modify-write and lets one `tryWith` run.
 * Boundary: integration tier (`.int`): needs Docker for the Testcontainers Valkey (`useValkey`). Each test uses its own
 *           keys on the shared server.
 * Runtime: node (vitest)
 * Governing contract: ADR 0103 (decision 2); ADR 0149 (decisions 1 to 3); ADR 0182 (integration tier); STA-2802.
 */
import { buildConfig } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import { SystemClockDriver } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { LockingConfig } from "#config/locking.config";
import { Locks } from "#core/services/locks.service";
import { useValkey } from "#node/__tests__/fixtures/valkey.fixture";
import { ValkeyLockDriver } from "#node/drivers/valkey-lock.driver";

const valkey = useValkey();

/** The fixture's server as the `LOCKING_VALKEY_URL` secret. */
class LockSecrets extends SecretStore {
  get(name: string): string | undefined {
    return name === "LOCKING_VALKEY_URL" ? valkey.url : undefined;
  }
}

/** A driver over the fixture's server, as one instance of a service has; closed after the file. */
const driver = (): ValkeyLockDriver =>
  valkey.track(
    new ValkeyLockDriver(
      buildConfig(LockingConfig, {
        values: { driver: "valkey", valkey: { keyPrefix: "it:lock:" } },
        secrets: new LockSecrets(),
      }),
    ),
  );

const TTL = Duration.seconds(5);

/** Resolves after `milliseconds`. */
const sleep = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

/** `value`, which the test expects present. */
function taken<T>(value: T | undefined): T {
  if (value === undefined) throw new Error("expected a value");
  return value;
}

describe(ValkeyLockDriver, () => {
  it("takes every key with the owner, token and TTL, and draws a larger token each time", async () => {
    const locks = driver();
    const first = await locks.tryAcquire(["a1", "a2"], "own-1", TTL);
    expect(first).toMatchObject({ keys: ["a1", "a2"], owner: "own-1" });
    expect(await valkey.client.get("it:lock:a1")).toBe(`own-1:${first?.token}`);
    expect(await valkey.client.get("it:lock:a2")).toBe(`own-1:${first?.token}`);
    const lifetime = await valkey.client.pttl("it:lock:a1");
    expect(lifetime).toBeGreaterThan(4000);
    expect(lifetime).toBeLessThanOrEqual(5000);
    await locks.release(taken(first));
    const second = await driver().tryAcquire(["a1"], "own-2", TTL);
    expect(taken(second).token).toBeGreaterThan(taken(first).token);
  });

  it("takes nothing when one key is held, so a lease is all or none", async () => {
    const held = await driver().tryAcquire(["b2"], "own-1", TTL);
    expect(await driver().tryAcquire(["b1", "b2", "b3"], "own-2", TTL)).toBeUndefined();
    expect(await valkey.client.exists("it:lock:b1", "it:lock:b3")).toBe(0);
    expect(await valkey.client.get("it:lock:b2")).toBe(`own-1:${held?.token}`);
  });

  it("gives one of many racing instances the key", async () => {
    const leases = await Promise.all(
      Array.from({ length: 12 }, (_, index) => driver().tryAcquire(["c1"], `own-${index}`, TTL)),
    );
    expect(leases.filter((lease) => lease !== undefined)).toHaveLength(1);
  });

  it("frees a key whose TTL lapsed", async () => {
    await driver().tryAcquire(["d1"], "own-1", Duration.parse("50ms"));
    await sleep(150);
    expect(await driver().tryAcquire(["d1"], "own-2", TTL)).toBeDefined();
  });

  it("renews only while every key holds the lease, and extends each", async () => {
    const locks = driver();
    const lease = await locks.tryAcquire(["e1", "e2"], "own-1", Duration.seconds(1));
    expect(await locks.renew(taken(lease), Duration.seconds(30))).toBe(true);
    expect(await valkey.client.pttl("it:lock:e1")).toBeGreaterThan(20_000);
    expect(await valkey.client.pttl("it:lock:e2")).toBeGreaterThan(20_000);
    await valkey.client.del("it:lock:e2");
    expect(await locks.renew(taken(lease), Duration.seconds(60))).toBe(false);
    expect(await valkey.client.pttl("it:lock:e1")).toBeLessThanOrEqual(30_000);
  });

  it("never renews or frees the successor's lock after its own lease lapsed", async () => {
    const locks = driver();
    const lapsed = await locks.tryAcquire(["f1"], "own-1", Duration.parse("50ms"));
    await sleep(150);
    const successor = await driver().tryAcquire(["f1"], "own-2", TTL);
    expect(await locks.renew(taken(lapsed), Duration.seconds(60))).toBe(false);
    await locks.release(taken(lapsed));
    expect(await valkey.client.get("it:lock:f1")).toBe(`own-2:${successor?.token}`);
    expect(await valkey.client.pttl("it:lock:f1")).toBeLessThanOrEqual(5000);
  });

  it("releases its own keys, so the next lease takes them at once", async () => {
    const locks = driver();
    const lease = await locks.tryAcquire(["g1", "g2"], "own-1", TTL);
    await locks.release(taken(lease));
    expect(await valkey.client.exists("it:lock:g1", "it:lock:g2")).toBe(0);
    expect(await driver().tryAcquire(["g1", "g2"], "own-2", TTL)).toBeDefined();
  });
});

describe("Locks over the valkey driver", () => {
  it("serialises a read-modify-write across two instances", async () => {
    const instances = [driver(), driver()].map((each) => new Locks(each, new SystemClockDriver()));
    await valkey.client.set("it:counter:h", "0");
    await Promise.all(
      Array.from({ length: 16 }, (_, index) =>
        taken(instances[index % 2]).with("h1", TTL, async () => {
          const seen = Number(await valkey.client.get("it:counter:h"));
          await sleep(2);
          await valkey.client.set("it:counter:h", String(seen + 1));
        }),
      ),
    );
    expect(await valkey.client.get("it:counter:h")).toBe("16");
    expect(await valkey.client.exists("it:lock:h1")).toBe(0);
  });

  it("runs one tryWith of many on one tick", async () => {
    const instances = [driver(), driver(), driver()].map(
      (each) => new Locks(each, new SystemClockDriver()),
    );
    let runs = 0;
    const ran = await Promise.all(
      instances.map((locks) =>
        locks.tryWith("i1", TTL, async () => {
          runs += 1;
          await sleep(50);
        }),
      ),
    );
    expect(ran.filter(Boolean)).toHaveLength(1);
    expect(runs).toBe(1);
  });
});
