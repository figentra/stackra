/**
 * Stackra file contract:
 * Purpose: unit tests of `JOB_BACKOFF`: the queue's old backoff values (10 s base, up to half again, 1 h cap) kept
 *          after stackra-223 moved the formula to @stackra/contracts, and each `Backoff` code's waits under it.
 * Boundary: test only; the jitter is pinned.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0148 (decision 1).
 */
import { Backoff, backoffDelay, Duration, Jitter } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { JOB_BACKOFF } from "#core/constants/job-backoff.constant";

const none = () => 0;

/** The wait after `attempt` under `JOB_BACKOFF` with the curve `backoff`. */
const wait = (backoff: Backoff, attempt: number, random = none) =>
  backoffDelay({ ...JOB_BACKOFF, backoff }, attempt, random);

describe("JOB_BACKOFF", () => {
  it("keeps the old values: 10 s, added jitter, an hour at most", () => {
    expect(JOB_BACKOFF).toEqual({
      base: Duration.seconds(10),
      max: Duration.hours(1),
      jitter: Jitter.Added,
    });
    expect(Object.isFrozen(JOB_BACKOFF)).toBe(true);
  });

  it("gives the old waits for each code", () => {
    expect([1, 2, 3, 4].map((attempt) => wait(Backoff.Exponential, attempt))).toEqual([
      10_000, 20_000, 40_000, 80_000,
    ]);
    expect(wait(Backoff.Linear, 3)).toBe(30_000);
    expect(wait(Backoff.Fixed, 3)).toBe(10_000);
    expect(wait(Backoff.Fixed, 1, () => 0.5)).toBe(12_500);
    expect(wait(Backoff.Exponential, 40)).toBe(3_600_000);
  });
});
