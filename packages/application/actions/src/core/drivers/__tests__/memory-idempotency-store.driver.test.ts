/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryIdempotencyStoreDriver`: a free key is claimed, a held key returns its pending record,
 *          a completed key returns its output, a released key is free again (a done key is not released), and a key
 *          is free once its time to live has passed on the clock.
 * Boundary: test only; the clock is a stand-in the test moves.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0136 (decision 3).
 */
import { Clock, Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { IdempotencyStore } from "#contracts/index";
import { MemoryIdempotencyStoreDriver } from "#core/drivers/memory-idempotency-store.driver";

class MovableClock extends Clock {
  time = Date.parse("2026-10-24T10:00:00Z");

  now(): Date {
    return new Date(this.time);
  }
}

const DAY = Duration.hours(24);

describe("MemoryIdempotencyStoreDriver", () => {
  it("is an IdempotencyStore", () => {
    expect(new MemoryIdempotencyStoreDriver(new MovableClock())).toBeInstanceOf(IdempotencyStore);
  });

  it("claims, completes and replays a key", async () => {
    const store = new MemoryIdempotencyStoreDriver(new MovableClock());
    expect(await store.claim("k", "f1", DAY)).toBeUndefined();
    expect(await store.claim("k", "f2", DAY)).toEqual({ fingerprint: "f1", done: false });
    await store.complete("k", { orderId: "ord_1" });
    expect(await store.claim("k", "f1", DAY)).toEqual({
      fingerprint: "f1",
      done: true,
      output: { orderId: "ord_1" },
    });
  });

  it("frees a released key but keeps a done one", async () => {
    const store = new MemoryIdempotencyStoreDriver(new MovableClock());
    await store.claim("held", "f", DAY);
    await store.release("held");
    expect(await store.claim("held", "g", DAY)).toBeUndefined();
    await store.complete("held", 1);
    await store.release("held");
    expect(await store.claim("held", "g", DAY)).toMatchObject({ done: true, output: 1 });
  });

  it("frees a key once its time to live has passed", async () => {
    const clock = new MovableClock();
    const store = new MemoryIdempotencyStoreDriver(clock);
    await store.claim("k", "f", DAY);
    await store.complete("k", 1);
    clock.time += Duration.toMilliseconds(DAY);
    expect(await store.claim("k", "f", DAY)).toBeUndefined();
  });
});
