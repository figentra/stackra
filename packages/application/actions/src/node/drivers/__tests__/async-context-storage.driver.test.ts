/**
 * Stackra file contract:
 * Purpose: unit tests of `AsyncContextStorageDriver`: a `ContextStorage` whose value survives `await` and timers,
 *          nests, and is gone outside `run`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0136 (decision 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { ContextStorage } from "#contracts/index";
import { AsyncContextStorageDriver } from "#node/drivers/async-context-storage.driver";

describe("AsyncContextStorageDriver", () => {
  it("is a ContextStorage with nothing stored outside run", () => {
    const storage = new AsyncContextStorageDriver();
    expect(storage).toBeInstanceOf(ContextStorage);
    expect(storage.current()).toBeUndefined();
  });

  it("keeps the value across await and nests", async () => {
    const storage = new AsyncContextStorageDriver();
    const outer = { callId: "outer" };
    const inner = { callId: "inner" };
    const seen = await storage.run(outer, async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 1);
      });
      const nested = storage.run(inner, () => storage.current());
      return [storage.current(), nested];
    });
    expect(seen).toEqual([outer, inner]);
    expect(storage.current()).toBeUndefined();
  });
});
