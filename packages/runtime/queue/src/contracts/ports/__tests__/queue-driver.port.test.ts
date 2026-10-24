/**
 * Stackra file contract:
 * Purpose: unit tests of the `QueueDriver` port: it is a `Port` whose class is its token, keyed `queue.QueueDriver`, a
 *          driver subclass implements its seven methods, and the stored job carries what a worker needs.
 * Boundary: test only; a minimal in-test driver stands in for a real one.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0142 (drivers behind ports); ADR 0148 (decision 1).
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import type { Actor, Duration, PublicId, ScopeRef } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { QueueDriver } from "#contracts/ports/queue-driver.port";
import type { QueuedJob } from "#contracts/types/queued-job.type";

/** A driver that stores nothing. */
class NullQueueDriver extends Driver(QueueDriver) {
  async push(): Promise<boolean> {
    return true;
  }

  async reserve(): Promise<QueuedJob | undefined> {
    return undefined;
  }

  async retry(): Promise<void> {}

  async deadLetter(): Promise<void> {}

  async remove(): Promise<void> {}

  async deadLetters(): Promise<readonly QueuedJob[]> {
    return [];
  }

  async redrive(): Promise<boolean> {
    return false;
  }
}

describe("QueueDriver", () => {
  it("is a port a driver implements", async () => {
    const driver: QueueDriver = new NullQueueDriver();
    expect(driver).toBeInstanceOf(QueueDriver);
    expect(driver).toBeInstanceOf(Port);
    await expect(driver.reserve(undefined, new Date())).resolves.toBeUndefined();
  });

  it("is keyed queue.QueueDriver", () => {
    expectTypeOf<QueueDriver["~key"]>().toEqualTypeOf<"queue.QueueDriver">();
  });

  it("stores who, where and when for each job", () => {
    expectTypeOf<QueuedJob["id"]>().toEqualTypeOf<PublicId<"job">>();
    expectTypeOf<QueuedJob["origin"]>().toEqualTypeOf<Actor | undefined>();
    expectTypeOf<QueuedJob["scope"]>().toEqualTypeOf<ScopeRef | undefined>();
    expectTypeOf<QueuedJob["lease"]>().toEqualTypeOf<Duration>();
    expectTypeOf<QueuedJob["runAt"]>().toEqualTypeOf<Date>();
  });
});
