/**
 * Stackra file contract:
 * Purpose: unit tests of `localDay`: the local day number of an instant.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0366.
 */
import { describe, expect, it } from "@stackra/testing";

import { dayNumber } from "#core/functions/day-number.function";
import { localDay } from "#core/functions/local-day.function";

describe("localDay", () => {
  it("reads the local day", () => {
    expect(localDay(0, "UTC")).toBe(0);
    expect(localDay(Date.parse("2026-01-04T21:00:00Z"), "Asia/Riyadh")).toBe(
      dayNumber("2026-01-05"),
    );
  });
});
