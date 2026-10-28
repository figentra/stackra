/**
 * Stackra file contract:
 * Purpose: unit tests of `withTabLock`: it returns the task's result, runs tasks of one name one at a time, releases
 *          the lock when the task throws, and lets tasks of different names run together.
 * Boundary: test only; uses the memory method.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0084 (the coordinator row: locks).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";

import { MEMORY_ELECTIONS } from "#core/constants/memory-elections.constant";
import { ElectionMethod } from "#core/enums/election-method.enum";
import { electLeader } from "#core/functions/elect-leader.function";
import { withTabLock } from "#core/functions/with-tab-lock.function";

const memory = { method: ElectionMethod.Memory } as const;

/** A promise and the function that resolves it. */
function deferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("withTabLock", () => {
  afterEach(() => {
    MEMORY_ELECTIONS.clear();
  });

  it("returns the task's result and releases the lock", async () => {
    await expect(withTabLock("refresh", () => 42, memory)).resolves.toBe(42);
    expect(electLeader("refresh", memory).isLeader.get()).toBe(true);
  });

  it("runs tasks of one name one at a time", async () => {
    const order: string[] = [];
    const gate = deferred();
    const first = withTabLock(
      "refresh",
      async () => {
        order.push("first:start");
        await gate.promise;
        order.push("first:end");
      },
      memory,
    );
    const second = withTabLock("refresh", () => order.push("second"), memory);
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
    expect(order).toEqual(["first:start"]);
    gate.resolve();
    await Promise.all([first, second]);
    expect(order).toEqual(["first:start", "first:end", "second"]);
  });

  it("releases the lock when the task throws", async () => {
    await expect(
      withTabLock(
        "refresh",
        () => {
          throw new Error("refresh failed");
        },
        memory,
      ),
    ).rejects.toThrow("refresh failed");
    expect(MEMORY_ELECTIONS.has("refresh")).toBe(false);
  });

  it("lets tasks of different names run together", async () => {
    const gate = deferred();
    const blocked = withTabLock("refresh", () => gate.promise, memory);
    await expect(withTabLock("migrate", () => "done", memory)).resolves.toBe("done");
    gate.resolve();
    await blocked;
  });
});
