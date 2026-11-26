/**
 * Stackra file contract:
 * Purpose: unit tests of `sunsetReached`: a version at or past the sunset reaches it, a prerelease does not, a date on or
 *          after a dated sunset does, and forms that differ or do not parse never do.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0131 (decision 4); ADR 0177 (decision 6); STA-2836.
 */
import { describe, expect, it } from "@stackra/testing";

import { sunsetReached } from "#core/functions/sunset-reached.function";

describe(sunsetReached, () => {
  it("compares release versions, a prerelease before its release", () => {
    expect(sunsetReached("0.35.0", "0.35.0")).toBe(true);
    expect(sunsetReached("0.35.0", "0.36.1")).toBe(true);
    expect(sunsetReached("0.35.0", "1.0.0")).toBe(true);
    expect(sunsetReached("0.35.0", "0.34.9")).toBe(false);
    expect(sunsetReached("0.35.0", "0.35.0-next.2")).toBe(false);
    expect(sunsetReached("0.35.0-next.2", "0.35.0-next.3")).toBe(true);
    expect(sunsetReached("0.35.0-next.3", "0.35.0-next.2")).toBe(false);
    expect(sunsetReached("0.35.0-next.2", "0.35.0")).toBe(true);
  });

  it("compares dates", () => {
    expect(sunsetReached("2027-05-26", "2027-05-26")).toBe(true);
    expect(sunsetReached("2027-05-26", "2027-06-01")).toBe(true);
    expect(sunsetReached("2027-05-26", "2027-05-25")).toBe(false);
  });

  it("never counts different forms or malformed values as reached", () => {
    expect(sunsetReached("0.35.0", "2030-01-01")).toBe(false);
    expect(sunsetReached("2027-05-26", "9.0.0")).toBe(false);
    expect(sunsetReached("soon", "soon")).toBe(false);
  });
});
