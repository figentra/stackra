/**
 * Stackra file contract:
 * Purpose: unit tests of `zoneOffset`: fixed and seasonal offsets, and an unknown zone.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0366.
 */
import { describe, expect, it } from "@stackra/testing";

import { zoneOffset } from "#core/functions/zone-offset.function";

describe("zoneOffset", () => {
  it("reads the offset at an instant", () => {
    expect(zoneOffset(0, "UTC")).toBe(0);
    expect(zoneOffset(Date.parse("2026-01-04T00:00:00Z"), "Asia/Riyadh")).toBe(3 * 3_600_000);
    expect(zoneOffset(Date.parse("2026-07-01T00:00:00Z"), "Europe/Berlin")).toBe(2 * 3_600_000);
    expect(zoneOffset(Date.parse("2026-12-01T00:00:00Z"), "Europe/Berlin")).toBe(3_600_000);
  });

  it("refuses an unknown zone", () => {
    expect(() => zoneOffset(0, "Mars/Olympus")).toThrow(RangeError);
  });
});
