/**
 * Stackra file contract:
 * Purpose: unit tests of `CircuitBreaker`: failures in a row open it, a success resets the count, an open circuit
 *          refuses until its cooldown passes and says how long, a half-open circuit lets its trial calls through and
 *          closes on a trial that works or reopens on one that fails, a neutral outcome frees a trial place, late
 *          outcomes of calls admitted while closed change nothing once it opened, and bad options throw.
 * Boundary: test only; time is passed in, so no timers.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; STA-1467.
 */
import { describe, expect, it } from "@stackra/testing";

import { CircuitState } from "#core/enums/circuit-state.enum";
import { CircuitBreaker } from "#core/values/circuit-breaker.value";

/** Fails `count` calls at `now`. */
function failTimes(breaker: CircuitBreaker, count: number, now: number): void {
  for (let index = 0; index < count; index += 1) breaker.admit(now)?.fail(now);
}

describe("CircuitBreaker", () => {
  it("opens after the threshold of failures in a row and refuses until the cooldown passes", () => {
    const breaker = new CircuitBreaker({ failureThreshold: 3, cooldownMs: 1000 });
    failTimes(breaker, 2, 0);
    expect(breaker.state(0)).toBe(CircuitState.Closed);
    failTimes(breaker, 1, 10);
    expect(breaker.state(10)).toBe(CircuitState.Open);
    expect(breaker.admit(500)).toBeUndefined();
    expect(breaker.retryAfterMs(500)).toBe(510);
    expect(breaker.state(1010)).toBe(CircuitState.HalfOpen);
    expect(breaker.retryAfterMs(1010)).toBe(0);
  });

  it("counts only failures in a row: a success resets the count", () => {
    const breaker = new CircuitBreaker({ failureThreshold: 3, cooldownMs: 1000 });
    failTimes(breaker, 2, 0);
    breaker.admit(0)?.succeed();
    failTimes(breaker, 2, 0);
    expect(breaker.state(0)).toBe(CircuitState.Closed);
  });

  it("closes on a trial call that works once half open", () => {
    const breaker = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 100 });
    failTimes(breaker, 1, 0);
    const trial = breaker.admit(100);
    expect(trial?.probe).toBe(true);
    expect(breaker.admit(100)).toBeUndefined();
    expect(breaker.retryAfterMs(100)).toBe(100);
    trial?.succeed();
    expect(breaker.state(100)).toBe(CircuitState.Closed);
    expect(breaker.admit(100)?.probe).toBe(false);
  });

  it("reopens for a fresh cooldown when a trial call fails", () => {
    const breaker = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 100 });
    failTimes(breaker, 1, 0);
    breaker.admit(150)?.fail(150);
    expect(breaker.state(200)).toBe(CircuitState.Open);
    expect(breaker.retryAfterMs(200)).toBe(50);
    expect(breaker.state(250)).toBe(CircuitState.HalfOpen);
  });

  it("frees a trial place on a neutral outcome without closing or reopening", () => {
    const breaker = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 100, halfOpenProbes: 1 });
    failTimes(breaker, 1, 0);
    const trial = breaker.admit(100);
    trial?.release();
    expect(breaker.state(100)).toBe(CircuitState.HalfOpen);
    expect(breaker.admit(100)?.probe).toBe(true);
  });

  it("ignores late outcomes of calls admitted while closed once the circuit opened", () => {
    const breaker = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 100 });
    const early = breaker.admit(0);
    const late = breaker.admit(0);
    failTimes(breaker, 2, 0);
    early?.succeed();
    expect(breaker.state(10)).toBe(CircuitState.Open);
    late?.fail(90);
    expect(breaker.retryAfterMs(90)).toBe(10);
  });

  it("counts an outcome reported twice once", () => {
    const breaker = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 100 });
    const ticket = breaker.admit(0);
    ticket?.fail(0);
    ticket?.fail(0);
    expect(breaker.state(0)).toBe(CircuitState.Closed);
  });

  it("refuses options that make no circuit", () => {
    expect(() => new CircuitBreaker({ failureThreshold: 0, cooldownMs: 1 })).toThrow(RangeError);
    expect(() => new CircuitBreaker({ failureThreshold: 1, cooldownMs: 0 })).toThrow(RangeError);
    expect(
      () => new CircuitBreaker({ failureThreshold: 1, cooldownMs: Number.POSITIVE_INFINITY }),
    ).toThrow(RangeError);
    expect(
      () => new CircuitBreaker({ failureThreshold: 1, cooldownMs: 1, halfOpenProbes: 0 }),
    ).toThrow(RangeError);
  });
});
