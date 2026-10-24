/**
 * Stackra file contract:
 * Purpose: unit tests of the `Clock` port: it is a `Port`, an implementation is an instance of both, and the class
 *          works as the token a fixed clock is bound to.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 16).
 */
import { describe, expect, it } from "@stackra/testing";

import { Port } from "#core/bases/port.base";
import { Clock } from "#core/ports/clock.port";

class FixedClock extends Clock {
  private readonly iso: string;

  constructor(iso: string) {
    super();
    this.iso = iso;
  }

  override now(): Date {
    return new Date(this.iso);
  }
}

describe("Clock", () => {
  it("is a port an implementation extends", () => {
    const clock = new FixedClock("2026-10-24T12:00:00.000Z");
    expect(clock).toBeInstanceOf(Clock);
    expect(clock).toBeInstanceOf(Port);
    expect(Object.getPrototypeOf(Clock)).toBe(Port);
  });

  it("returns a new Date the caller owns", () => {
    const clock: Clock = new FixedClock("2026-10-24T12:00:00.000Z");
    const first = clock.now();
    first.setUTCFullYear(1999);
    expect(clock.now().toISOString()).toBe("2026-10-24T12:00:00.000Z");
  });

  it("is the token a binding is found by", () => {
    const bindings = new Map<abstract new (...args: never[]) => Port, Port>([
      [Clock, new FixedClock("2026-10-24T00:00:00.000Z")],
    ]);
    expect(bindings.get(Clock)).toBeInstanceOf(FixedClock);
  });
});
