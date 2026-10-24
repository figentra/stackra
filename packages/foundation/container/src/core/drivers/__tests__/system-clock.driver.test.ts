/**
 * Stackra file contract:
 * Purpose: unit tests of the system `Clock` driver: a driver of `Clock` that reads the host clock, so a frozen clock
 *          from @stackra/testing fixes what it returns.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing; time is faked).
 */
import { Clock } from "@stackra/contracts";
import { describe, expect, freezeClock, it } from "@stackra/testing";

import { SystemClockDriver } from "#core/drivers/system-clock.driver";
import { kindOf } from "#core/functions/kind-of.function";

describe("SystemClockDriver", () => {
  it("is a driver of Clock", () => {
    expect(new SystemClockDriver()).toBeInstanceOf(Clock);
    expect(kindOf(SystemClockDriver)).toEqual({ kind: "driver", options: { port: Clock } });
  });

  it("tells the host time, which a frozen clock fixes", () => {
    freezeClock("2026-10-24T09:00:00Z");
    const clock = new SystemClockDriver();
    expect(clock.now().toISOString()).toBe("2026-10-24T09:00:00.000Z");
    expect(clock.now()).not.toBe(clock.now());
  });
});
