/**
 * Stackra file contract:
 * Purpose: unit tests of `minuteOfDay`: minutes after midnight and refusals.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0366.
 */
import { describe, expect, it } from "@stackra/testing";

import { minuteOfDay } from "#core/functions/minute-of-day.function";

describe("minuteOfDay", () => {
  it("reads HH:mm", () => {
    expect(minuteOfDay("00:00")).toBe(0);
    expect(minuteOfDay("09:30")).toBe(570);
    expect(minuteOfDay("23:59")).toBe(1439);
  });

  it.each(["24:00", "9:30", "09:60", "09:30:00"])("refuses %j", (time) => {
    expect(() => minuteOfDay(time)).toThrow(RangeError);
  });
});
