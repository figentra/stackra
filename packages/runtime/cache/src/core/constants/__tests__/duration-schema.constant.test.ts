/**
 * Stackra file contract:
 * Purpose: unit tests of `DURATION_SCHEMA`: either duration form is read into its canonical form, and text that is
 *          not a duration is refused with a message naming it.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 26).
 */
import { describe, expect, it } from "@stackra/testing";

import { DURATION_SCHEMA } from "#core/constants/duration-schema.constant";

describe("DURATION_SCHEMA", () => {
  it("reads either form into the canonical one", () => {
    expect(DURATION_SCHEMA.parse("5s")).toBe("PT5S");
    expect(DURATION_SCHEMA.parse("PT0.05S")).toBe("PT0.05S");
    expect(DURATION_SCHEMA.parse("50ms")).toBe("PT0.05S");
  });

  it("refuses text that is not a duration", () => {
    const result = DURATION_SCHEMA.safeParse("soon");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain('"soon"');
  });
});
