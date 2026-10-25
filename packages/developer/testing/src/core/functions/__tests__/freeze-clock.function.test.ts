/**
 * Stackra file contract:
 * Purpose: proves freezeClock pins `Date.now()` and `new Date()`, leaves timers real, moves on a second call, refuses
 *          a bad instant, and restores the real clock after the test, at once on request, or by hand after
 *          `beforeAll`.
 * Boundary: the global Date of the test worker; the tests in a file run in order, so a later test sees what an
 *           earlier one left behind.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 2); ADR 0022 (test placement).
 */
import { afterAll, beforeAll, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";
import { freezeClock } from "#core/functions/freeze-clock.function";

/** The frozen instant of these cases. */
const AT = "2026-10-21T09:00:00Z";

/** A wall-clock reading that fake Date cannot touch. */
const realNow = (): number => performance.timeOrigin + performance.now();

// @covers sta-348:FR-003
describe(freezeClock, () => {
  it("pins Date.now and new Date to the instant", () => {
    freezeClock(AT);
    expect(Date.now()).toBe(Date.parse(AT));
    expect(new Date().toISOString()).toBe("2026-10-21T09:00:00.000Z");
  });

  it("restores the real clock when the previous test finished", () => {
    expect(vi.isFakeTimers()).toBe(false);
    expect(Math.abs(Date.now() - realNow())).toBeLessThan(1_000);
  });

  it("keeps timers real, so awaited work settles while the time stands still", async () => {
    freezeClock(AT);
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(Date.now()).toBe(Date.parse(AT));
  });

  it("moves the frozen instant when called again", () => {
    freezeClock(AT);
    freezeClock("2027-01-01T00:00:00Z");
    expect(new Date().toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });

  it("restores at once through the returned function", () => {
    const restore = freezeClock(AT);
    restore();
    expect(vi.isFakeTimers()).toBe(false);
    expect(Date.now()).not.toBe(Date.parse(AT));
  });

  it("refuses an instant that is not a date and leaves the clock real", () => {
    expect(() => freezeClock("not-a-date")).toThrow(RangeError);
    expect(vi.isFakeTimers()).toBe(false);
  });

  describe("called in beforeAll", () => {
    let restore: (() => void) | undefined;

    beforeAll(() => {
      restore = freezeClock(AT);
    });

    afterAll(() => restore?.());

    it("holds for the first test of the block", () => {
      expect(Date.now()).toBe(Date.parse(AT));
    });

    it("still holds for the next one", () => {
      expect(new Date().toISOString()).toBe("2026-10-21T09:00:00.000Z");
    });
  });

  it("is real again once the block's afterAll restored it", () => {
    expect(vi.isFakeTimers()).toBe(false);
  });
});
