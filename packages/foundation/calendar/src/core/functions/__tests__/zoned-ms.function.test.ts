/**
 * Stackra file contract:
 * Purpose: unit tests of `zonedMs`: a local wall time to epoch milliseconds.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0366.
 */
import { describe, expect, it } from "@stackra/testing";

import { dayNumber } from "#core/functions/day-number.function";
import { zonedMs } from "#core/functions/zoned-ms.function";

describe("zonedMs", () => {
  it("resolves a wall time", () => {
    expect(zonedMs(0, 60, "UTC")).toBe(3_600_000);
    expect(zonedMs(dayNumber("2026-01-04"), 540, "Asia/Riyadh")).toBe(
      Date.parse("2026-01-04T06:00:00Z"),
    );
  });
});
