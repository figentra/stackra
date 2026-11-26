/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryIdempotencyStoreDriver`: a free key is claimed, a held key returns its pending record,
 *          a completed key returns its output, a released key is free again (a done key is not released), a held key
 *          is free once its lease has passed while a done key keeps its replay window, a late completion of a lapsed
 *          key still lands but never over another call's claim, and a key is free once its time to live has passed;
 *          `extend` keeps the holder's claim held for the replay window (or takes a free key again) and answers false,
 *          touching nothing, once another call holds the key or it is done; `release` frees only the holder's claim
 *          (STA-2797).
 * Boundary: test only; the clock is a stand-in the test moves.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0136 (decision 3).
 */
import { Clock, Duration } from "@stackra/contracts";
import { ErrorKind } from "@stackra/errors";
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

const LEASE = Duration.minutes(15);

describe("MemoryIdempotencyStoreDriver", () => {
  it("is an IdempotencyStore", () => {
    expect(new MemoryIdempotencyStoreDriver(new MovableClock())).toBeInstanceOf(IdempotencyStore);
  });

  it("claims, completes and replays a key", async () => {
    const store = new MemoryIdempotencyStoreDriver(new MovableClock());
    expect(await store.claim("k", "f1", DAY, "h1")).toBeUndefined();
    expect(await store.claim("k", "f2", DAY, "h2")).toEqual({ fingerprint: "f1", done: false });
    await store.complete("k", "f1", { orderId: "ord_1" }, DAY, "h1");
    expect(await store.claim("k", "f1", DAY, "h3")).toEqual({
      fingerprint: "f1",
      done: true,
      output: { orderId: "ord_1" },
    });
  });

  it("frees a released key but keeps a done one", async () => {
    const store = new MemoryIdempotencyStoreDriver(new MovableClock());
    await store.claim("held", "f", DAY, "h1");
    await store.release("held", "h1");
    expect(await store.claim("held", "g", DAY, "h2")).toBeUndefined();
    await store.complete("held", "g", 1, DAY, "h2");
    await store.release("held", "h2");
    expect(await store.claim("held", "g", DAY, "h3")).toMatchObject({ done: true, output: 1 });
  });

  it("frees a key once its time to live has passed", async () => {
    const clock = new MovableClock();
    const store = new MemoryIdempotencyStoreDriver(clock);
    await store.claim("k", "f", DAY, "h1");
    await store.complete("k", "f", 1, DAY, "h1");
    clock.time += Duration.toMilliseconds(DAY);
    expect(await store.claim("k", "f", DAY, "h2")).toBeUndefined();
  });

  it("frees a held key once its lease has passed, but keeps a completed key for its whole window", async () => {
    const clock = new MovableClock();
    const store = new MemoryIdempotencyStoreDriver(clock);
    await store.claim("crashed", "f", LEASE, "h1");
    await store.claim("finished", "f", LEASE, "h2");
    await store.complete("finished", "f", { orderId: "ord_1" }, DAY, "h2");
    clock.time += Duration.toMilliseconds(LEASE);
    // the first call never finished: after the lease a retry runs instead of meeting in-progress for a day
    expect(await store.claim("crashed", "f", LEASE, "h3")).toBeUndefined();
    clock.time += Duration.toMilliseconds(Duration.hours(23));
    expect(await store.claim("finished", "f", LEASE, "h4")).toEqual({
      fingerprint: "f",
      done: true,
      output: { orderId: "ord_1" },
    });
  });

  it("lands a late completion on a lapsed key, never over another call's claim or a done key", async () => {
    const clock = new MovableClock();
    const store = new MemoryIdempotencyStoreDriver(clock);
    await store.claim("late", "f", LEASE, "h1");
    clock.time += Duration.toMilliseconds(LEASE);
    await store.complete("late", "f", 1, DAY, "h1");
    expect(await store.claim("late", "f", LEASE, "h2")).toMatchObject({ done: true, output: 1 });
    await store.claim("taken", "other", LEASE, "theirs");
    await store.complete("taken", "f", 2, DAY, "mine");
    expect(await store.claim("taken", "f", LEASE, "h3")).toEqual({
      fingerprint: "other",
      done: false,
    });
    // the same body under another holder (a retry that took the lapsed key) is still another call's claim
    await store.complete("taken", "other", 3, DAY, "mine");
    expect(await store.claim("taken", "other", LEASE, "h4")).toEqual({
      fingerprint: "other",
      done: false,
    });
    await store.complete("taken", "other", 3, DAY, "theirs");
    await store.complete("taken", "other", 4, DAY, "theirs");
    expect(await store.claim("taken", "other", LEASE, "h5")).toMatchObject({
      done: true,
      output: 3,
    });
  });

  it("extends the holder's claim to the replay window, so it outlives the lease without being done", async () => {
    const clock = new MovableClock();
    const store = new MemoryIdempotencyStoreDriver(clock);
    await store.claim("k", "f", LEASE, "h1");
    expect(await store.extend("k", "f", DAY, "h1")).toBe(true);
    clock.time += Duration.toMilliseconds(Duration.hours(23));
    // a crash after the commit: the retry is told the call is in progress, for the whole window
    expect(await store.claim("k", "f", LEASE, "h2")).toEqual({ fingerprint: "f", done: false });
    await store.complete("k", "f", { orderId: "ord_1" }, DAY, "h1");
    expect(await store.claim("k", "f", LEASE, "h3")).toMatchObject({ done: true });
  });

  it("takes a free key again on extend, but answers false over another call's claim or a done key", async () => {
    const clock = new MovableClock();
    const store = new MemoryIdempotencyStoreDriver(clock);
    // the lease lapsed and nobody took the key: no other call can have written, so the claim is taken again
    await store.claim("free", "f", LEASE, "h1");
    clock.time += Duration.toMilliseconds(LEASE);
    expect(await store.extend("free", "f", DAY, "h1")).toBe(true);
    expect(await store.claim("free", "f", LEASE, "h2")).toEqual({ fingerprint: "f", done: false });
    // the lease lapsed and a retry with the same body took the key: the claim is lost, theirs untouched
    await store.claim("lost", "f", LEASE, "h1");
    clock.time += Duration.toMilliseconds(LEASE);
    await store.claim("lost", "f", LEASE, "retry");
    expect(await store.extend("lost", "f", DAY, "h1")).toBe(false);
    clock.time += Duration.toMilliseconds(LEASE);
    expect(await store.claim("lost", "f", LEASE, "h3")).toBeUndefined();
    // a done key is never turned back into a held one
    await store.claim("done", "f", LEASE, "h1");
    await store.complete("done", "f", 1, DAY, "h1");
    expect(await store.extend("done", "f", DAY, "h1")).toBe(false);
    expect(await store.claim("done", "f", LEASE, "h2")).toMatchObject({ done: true, output: 1 });
  });

  it("releases only the holder's own claim", async () => {
    const clock = new MovableClock();
    const store = new MemoryIdempotencyStoreDriver(clock);
    await store.claim("k", "f", LEASE, "h1");
    clock.time += Duration.toMilliseconds(LEASE);
    await store.claim("k", "f", LEASE, "retry");
    await store.release("k", "h1");
    expect(await store.claim("k", "f", LEASE, "h2")).toEqual({ fingerprint: "f", done: false });
    await store.release("k", "retry");
    expect(await store.claim("k", "f", LEASE, "h3")).toBeUndefined();
  });

  it("keeps a refusal whether or not the claim is still held, and frees it with the time to live", async () => {
    const clock = new MovableClock();
    const store = new MemoryIdempotencyStoreDriver(clock);
    const refusal = {
      kind: ErrorKind.Conflict,
      code: "out_of_stock",
      category: "conflict",
      retryable: false,
    } as const;
    await store.completeRefused("gone", "f", refusal, DAY);
    expect(await store.claim("gone", "f", DAY, "h1")).toEqual({
      fingerprint: "f",
      done: true,
      refusal,
    });
    await store.claim("held", "f", DAY, "h2");
    await store.completeRefused("held", "f", refusal, DAY);
    expect(await store.claim("held", "f", DAY, "h3")).toMatchObject({ done: true, refusal });
    clock.time += Duration.toMilliseconds(DAY);
    expect(await store.claim("gone", "f", DAY, "h4")).toBeUndefined();
  });
});
