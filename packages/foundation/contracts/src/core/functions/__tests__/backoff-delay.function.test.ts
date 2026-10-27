/**
 * Stackra file contract:
 * Purpose: unit tests of `backoffDelay`: each curve, the multiplier, each jitter, the cap, a zero base, and the
 *          refusals. The old per-package formulas are pinned here with the values they had before stackra-223, so the
 *          move changed no wait: queue (10 s doubling, up to half again, 1 h cap), realtime (1 s, equal jitter, the
 *          `maxBackoffSeconds` cap of 30 s), collaboration (500 ms, equal jitter), locking (10 ms doubling to 160 ms),
 *          transport (200 ms doubling to 5 s) and integrations (200 ms doubling to 30 s).
 * Boundary: test only; the jitter is pinned with a fixed `random`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0148 (decision 1); ADR 0225 (decision 1); owner D10 2026-10-28.
 */
import { describe, expect, it } from "@stackra/testing";

import { Duration } from "#core/constants/duration.constant";
import { Backoff } from "#core/enums/backoff.enum";
import { Jitter } from "#core/enums/jitter.enum";
import { backoffDelay } from "#core/functions/backoff-delay.function";

const none = () => 0;
const top = () => 1;

/** The queue's job policy before stackra-223: 10 s, up to half again, at most an hour. */
const queue = { base: Duration.seconds(10), max: Duration.hours(1), jitter: Jitter.Added };

/** Realtime's reconnect before stackra-223: 1 s doubling, equal jitter, `maxBackoffSeconds` 30. */
const realtime = { base: Duration.seconds(1), max: Duration.seconds(30), jitter: Jitter.Equal };

describe(backoffDelay, () => {
  it("doubles from base for exponential (the queue's 10 s steps)", () => {
    expect([1, 2, 3, 4].map((attempt) => backoffDelay(queue, attempt, none))).toEqual([
      10_000, 20_000, 40_000, 80_000,
    ]);
  });

  it("grows by base for linear and stays at base for fixed", () => {
    expect(backoffDelay({ ...queue, backoff: Backoff.Linear }, 3, none)).toBe(30_000);
    expect(backoffDelay({ ...queue, backoff: Backoff.Fixed }, 3, none)).toBe(10_000);
  });

  it("grows by the multiplier", () => {
    const tripling = { base: Duration.seconds(1), max: Duration.hours(1), multiplier: 3 };
    expect([1, 2, 3].map((attempt) => backoffDelay(tripling, attempt))).toEqual([1000, 3000, 9000]);
    expect(backoffDelay({ ...tripling, multiplier: 1 }, 5)).toBe(1000);
  });

  it("adds up to half again with Jitter.Added, never past max", () => {
    expect(backoffDelay({ ...queue, backoff: Backoff.Fixed }, 1, () => 0.5)).toBe(12_500);
    for (let index = 0; index < 50; index++) {
      const wait = backoffDelay(queue, 2);
      expect(wait).toBeGreaterThanOrEqual(20_000);
      expect(wait).toBeLessThanOrEqual(30_000);
    }
    expect(backoffDelay(queue, 40, none)).toBe(3_600_000);
    expect(backoffDelay({ ...queue, backoff: Backoff.Linear }, 1_000, () => 0.9)).toBe(3_600_000);
  });

  it("keeps the wait in the upper half with Jitter.Equal (realtime: attempt = old attempt + 1)", () => {
    expect([1, 2, 3, 4, 5, 6, 7].map((attempt) => backoffDelay(realtime, attempt, top))).toEqual([
      1000, 2000, 4000, 8000, 16_000, 30_000, 30_000,
    ]);
    expect(backoffDelay(realtime, 4, none)).toBe(4000);
    expect(backoffDelay(realtime, 4, () => 0.5)).toBe(6000);
    expect(backoffDelay({ ...realtime, max: Duration.seconds(60) }, 5001, top)).toBe(60_000);
  });

  it("keeps the other old defaults", () => {
    const collaboration = { ...realtime, base: Duration.parse("500ms") };
    expect(backoffDelay(collaboration, 1, top)).toBe(500);
    const locking = { base: Duration.parse("10ms"), max: Duration.parse("160ms") };
    expect([1, 2, 3, 4, 5, 6].map((attempt) => backoffDelay(locking, attempt))).toEqual([
      10, 20, 40, 80, 160, 160,
    ]);
    const transport = { base: Duration.parse("200ms"), max: Duration.seconds(5) };
    expect([1, 2, 5, 6].map((attempt) => backoffDelay(transport, attempt))).toEqual([
      200, 400, 3200, 5000,
    ]);
    const integrations = { base: Duration.parse("200ms"), max: Duration.seconds(30) };
    expect(backoffDelay(integrations, 9)).toBe(30_000);
  });

  it("waits nothing for a zero base, whatever the attempt", () => {
    expect(backoffDelay({ base: Duration.seconds(0), max: Duration.seconds(5) }, 5000)).toBe(0);
  });

  it("refuses a bad attempt, an unknown code and a multiplier below 1", () => {
    expect(() => backoffDelay(queue, 0)).toThrow(RangeError);
    expect(() => backoffDelay(queue, 1.5)).toThrow(RangeError);
    expect(() => backoffDelay({ ...queue, backoff: "random" as Backoff }, 1)).toThrow(RangeError);
    expect(() => backoffDelay({ ...queue, jitter: "full" as Jitter }, 1)).toThrow(RangeError);
    expect(() => backoffDelay({ ...queue, multiplier: 0.5 }, 1)).toThrow(RangeError);
  });
});
