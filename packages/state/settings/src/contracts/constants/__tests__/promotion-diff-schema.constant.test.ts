/**
 * Stackra file contract:
 * Purpose: unit tests of `PROMOTION_DIFF_SCHEMA` (`PromotionDiff$`): a diff with JSON rows parses as it is, and a
 *          diff with no base hash is refused.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 26); STA-1284.
 */
import { describe, expect, it } from "@stackra/testing";

import { PROMOTION_DIFF_SCHEMA } from "#contracts/constants/promotion-diff-schema.constant";

describe("PromotionDiff$", () => {
  it("parses a diff as it is", () => {
    const diff = {
      kind: "settings",
      base: "sha256:ab",
      changes: [{ key: "a", to: 1 }],
      previous: { a: 0 },
    };
    expect(PROMOTION_DIFF_SCHEMA.parse(diff)).toEqual(diff);
  });

  it("refuses a diff with no base hash", () => {
    expect(
      PROMOTION_DIFF_SCHEMA.safeParse({ kind: "settings", base: "", changes: [], previous: null })
        .success,
    ).toBe(false);
  });
});
