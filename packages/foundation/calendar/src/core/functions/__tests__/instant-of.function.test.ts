/**
 * Stackra file contract:
 * Purpose: unit tests of `instantOf`: local wall time to UTC in a fixed-offset zone and on both sides of a clock change; refusals.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0366.
 */
import { describe, expect, it } from "@stackra/testing";

import { instantOf } from "#core/functions/instant-of.function";

describe("instantOf", () => {
  it("converts a local time", () => {
    expect(instantOf("2026-01-04", "09:00", "Asia/Riyadh")).toBe("2026-01-04T06:00:00.000Z");
    expect(instantOf("2026-01-04", "00:00", "UTC")).toBe("2026-01-04T00:00:00.000Z");
  });

  it("follows a clock change", () => {
    expect(instantOf("2026-10-24", "09:00", "Europe/Berlin")).toBe("2026-10-24T07:00:00.000Z");
    expect(instantOf("2026-10-26", "09:00", "Europe/Berlin")).toBe("2026-10-26T08:00:00.000Z");
  });

  it("refuses a bad time, date or zone", () => {
    expect(() => instantOf("2026-01-04", "24:00", "UTC")).toThrow(RangeError);
    expect(() => instantOf("2026-13-04", "09:00", "UTC")).toThrow(RangeError);
    expect(() => instantOf("2026-01-04", "09:00", "Mars/Olympus")).toThrow(RangeError);
  });
});
