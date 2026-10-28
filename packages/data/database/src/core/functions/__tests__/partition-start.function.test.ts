/**
 * Stackra file contract:
 * Purpose: unit tests of `partitionStart`: the UTC start of a day, ISO week, month and year partition, and the ones
 *          after and before it, across a year end.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); data-layer gaps db12, sc4.
 */
import { describe, expect, it } from "@stackra/testing";

import { partitionStart } from "#core/functions/partition-start.function";

const at = new Date("2026-12-30T14:00:00Z"); // a Wednesday

describe("partitionStart", () => {
  it("starts each span in UTC", () => {
    expect(partitionStart(at, "day", 0).toISOString()).toBe("2026-12-30T00:00:00.000Z");
    expect(partitionStart(at, "week", 0).toISOString()).toBe("2026-12-28T00:00:00.000Z");
    expect(partitionStart(at, "month", 0).toISOString()).toBe("2026-12-01T00:00:00.000Z");
    expect(partitionStart(at, "year", 0).toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });

  it("steps forward and back across the year end", () => {
    expect(partitionStart(at, "day", 2).toISOString()).toBe("2027-01-01T00:00:00.000Z");
    expect(partitionStart(at, "week", 1).toISOString()).toBe("2027-01-04T00:00:00.000Z");
    expect(partitionStart(at, "month", 1).toISOString()).toBe("2027-01-01T00:00:00.000Z");
    expect(partitionStart(at, "month", -12).toISOString()).toBe("2025-12-01T00:00:00.000Z");
  });
});
