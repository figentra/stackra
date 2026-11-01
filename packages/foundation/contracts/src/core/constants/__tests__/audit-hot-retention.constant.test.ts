/**
 * Stackra file contract:
 * Purpose: unit tests of `AUDIT_HOT_RETENTION`: 397 days, the longest thirteen consecutive calendar months.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0212 (decision 6).
 */
import { describe, expect, it } from "@stackra/testing";

import { AUDIT_HOT_RETENTION } from "#core/constants/audit-hot-retention.constant";
import { Duration } from "#core/constants/duration.constant";

describe("AUDIT_HOT_RETENTION", () => {
  it("is 397 days: 8 x 31 + 4 x 30 + 29", () => {
    expect(Duration.toMilliseconds(AUDIT_HOT_RETENTION)).toBe((8 * 31 + 4 * 30 + 29) * 86_400_000);
    expect(8 * 31 + 4 * 30 + 29).toBe(397);
  });
});
