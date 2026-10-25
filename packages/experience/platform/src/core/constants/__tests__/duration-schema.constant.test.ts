/**
 * Stackra file contract:
 * Purpose: unit tests of `DURATION_SCHEMA`: an ISO 8601 duration passes as itself, anything else is refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 26).
 */
import { Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { DURATION_SCHEMA } from "#core/constants/duration-schema.constant";

describe("DURATION_SCHEMA", () => {
  it("accepts a Duration", () => {
    expect(DURATION_SCHEMA.parse(Duration.seconds(3))).toBe("PT3S");
  });

  it("refuses text that is not ISO 8601 and a value that is not text", () => {
    expect(DURATION_SCHEMA.safeParse("3 seconds").success).toBe(false);
    expect(DURATION_SCHEMA.safeParse(3000).success).toBe(false);
  });
});
