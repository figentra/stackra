/**
 * Stackra file contract:
 * Purpose: unit tests of the `LockDriver` port: an abstract `Port`, so a driver extending it is a `LockDriver` to every
 *          consumer and answers through the four members.
 * Boundary: test only; a minimal driver stands in for the real ones.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 16); ADR 0103; ADR 0149.
 */
import { Driver } from "@stackra/container";
import { Duration, Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { LockDriver } from "#contracts/ports/lock-driver.port";
import type { LockLease } from "#contracts/types/lock-lease.type";

/** Grants every lease with token 1 and never loses one. */
class GrantingLockDriver extends Driver(LockDriver) {
  async within<T>(work: () => Promise<T>): Promise<T> {
    return work();
  }

  async tryAcquire(keys: readonly string[], owner: string): Promise<LockLease | undefined> {
    return { keys, owner, token: 1 };
  }

  async renew(): Promise<boolean> {
    return true;
  }

  async release(): Promise<void> {}
}

describe("LockDriver", () => {
  it("is a port a driver extends", async () => {
    const driver: LockDriver = new GrantingLockDriver();
    expect(driver).toBeInstanceOf(LockDriver);
    expect(driver).toBeInstanceOf(Port);
    const lease = await driver.within(() =>
      driver.tryAcquire(["a"], "owner-1", Duration.seconds(1)),
    );
    expect(lease).toEqual({ keys: ["a"], owner: "owner-1", token: 1 });
  });
});
