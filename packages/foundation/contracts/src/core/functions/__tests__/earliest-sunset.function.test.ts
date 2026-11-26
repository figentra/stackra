/**
 * Stackra file contract:
 * Purpose: unit tests of `earliestSunset`: the next minor before 1.0, the next major from 1.0, six months on for a date
 *          version (clamped to a shorter month), and `undefined` for anything else.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0177 (decision 6); ADR 0136 (decision 4); STA-2836.
 */
import { describe, expect, it } from "@stackra/testing";

import { earliestSunset } from "#core/functions/earliest-sunset.function";

describe(earliestSunset, () => {
  it("gives the next minor before 1.0 and the next major from 1.0", () => {
    expect(earliestSunset("0.34.2")).toBe("0.35.0");
    expect(earliestSunset("0.34.0-next.3")).toBe("0.35.0");
    expect(earliestSunset("1.0.0")).toBe("2.0.0");
    expect(earliestSunset("3.7.1")).toBe("4.0.0");
  });

  it("gives six months on for a date version, clamped to the end of a shorter month", () => {
    expect(earliestSunset("2026-11-26")).toBe("2027-05-26");
    expect(earliestSunset("2026-08-31")).toBe("2027-02-28");
    expect(earliestSunset("2027-08-31")).toBe("2028-02-29");
    expect(earliestSunset("2026-01-15")).toBe("2026-07-15");
  });

  it("is undefined for anything else", () => {
    expect(earliestSunset("soon")).toBeUndefined();
    expect(earliestSunset("1.2")).toBeUndefined();
    expect(earliestSunset("01.2.3")).toBeUndefined();
    expect(earliestSunset("2026-02-30")).toBeUndefined();
    expect(earliestSunset("2026-13-01")).toBeUndefined();
  });
});
