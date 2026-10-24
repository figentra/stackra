/**
 * Stackra file contract:
 * Purpose: unit tests of `LicenceStanding`: exactly the three soft-enforcement codes, in snake_case.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0178 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { LicenceStanding } from "#core/enums/licence-standing.enum";

describe("LicenceStanding", () => {
  it("has the three standings", () => {
    expect(LicenceStanding.Active).toBe("active");
    expect(LicenceStanding.Grace).toBe("grace");
    expect(LicenceStanding.ReadOnly).toBe("read_only");
  });
});
