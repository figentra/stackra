/**
 * Stackra file contract:
 * Purpose: unit tests of `Bulkhead`: it admits up to `limit` calls, queues up to `queue` more in arrival order, turns
 *          the rest away at once, turns a waiter away once `maxWaitMs` passes, hands a freed place straight to the
 *          oldest waiter, releases each place once however often release is called, and refuses bad options.
 * Boundary: test only; fake timers drive the wait.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; STA-1467.
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { Bulkhead } from "#core/values/bulkhead.value";

afterEach(() => {
  vi.useRealTimers();
});

describe("Bulkhead", () => {
  it("admits up to its limit and turns the next call away at once when it has no queue", async () => {
    const bulkhead = new Bulkhead({ limit: 2 });
    const first = await bulkhead.enter();
    const second = await bulkhead.enter();
    expect(first).toBeTypeOf("function");
    expect(second).toBeTypeOf("function");
    expect(bulkhead.active).toBe(2);
    expect(await bulkhead.enter()).toBeUndefined();
    first?.();
    expect(bulkhead.active).toBe(1);
    expect(await bulkhead.enter()).toBeTypeOf("function");
  });

  it("queues up to its queue, serves waiters in arrival order and turns away past the queue", async () => {
    const bulkhead = new Bulkhead({ limit: 1, queue: 2 });
    const held = await bulkhead.enter();
    const order: string[] = [];
    const a = bulkhead.enter().then((release) => {
      order.push("a");
      return release;
    });
    const b = bulkhead.enter().then((release) => {
      order.push("b");
      return release;
    });
    expect(bulkhead.queued).toBe(2);
    expect(await bulkhead.enter()).toBeUndefined();
    held?.();
    const releaseA = await a;
    expect(order).toEqual(["a"]);
    expect(bulkhead.active).toBe(1);
    releaseA?.();
    const releaseB = await b;
    expect(order).toEqual(["a", "b"]);
    releaseB?.();
    expect(bulkhead.active).toBe(0);
    expect(bulkhead.queued).toBe(0);
  });

  it("turns a waiter away once its wait passes, and frees its queue place", async () => {
    vi.useFakeTimers();
    const bulkhead = new Bulkhead({ limit: 1, queue: 1, maxWaitMs: 500 });
    const held = await bulkhead.enter();
    const waiting = bulkhead.enter();
    expect(bulkhead.queued).toBe(1);
    await vi.advanceTimersByTimeAsync(499);
    expect(bulkhead.queued).toBe(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(await waiting).toBeUndefined();
    expect(bulkhead.queued).toBe(0);
    held?.();
    expect(bulkhead.active).toBe(0);
  });

  it("does not queue when the wait is zero", async () => {
    const bulkhead = new Bulkhead({ limit: 1, queue: 5, maxWaitMs: 0 });
    await bulkhead.enter();
    expect(await bulkhead.enter()).toBeUndefined();
    expect(bulkhead.queued).toBe(0);
  });

  it("gives a place back once however often release is called", async () => {
    const bulkhead = new Bulkhead({ limit: 2 });
    const release = await bulkhead.enter();
    await bulkhead.enter();
    release?.();
    release?.();
    expect(bulkhead.active).toBe(1);
  });

  it("refuses options that cannot admit anything", () => {
    expect(() => new Bulkhead({ limit: 0 })).toThrow(RangeError);
    expect(() => new Bulkhead({ limit: 1.5 })).toThrow(RangeError);
    expect(() => new Bulkhead({ limit: 1, queue: -1 })).toThrow(RangeError);
    expect(() => new Bulkhead({ limit: 1, maxWaitMs: -1 })).toThrow(RangeError);
    expect(() => new Bulkhead({ limit: 1, maxWaitMs: Number.NaN })).toThrow(RangeError);
  });
});
