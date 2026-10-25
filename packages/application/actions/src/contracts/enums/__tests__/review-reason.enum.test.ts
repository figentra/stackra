/**
 * Stackra file contract:
 * Purpose: unit and type tests of `ReviewReason`: an `Enum.of` enum of the two reasons a document is reviewed, codes in
 *          source order, with a same-named type.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 16: Enum); ADR 0337 (decisions 4 and 5).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { ReviewReason } from "#contracts/enums/review-reason.enum";

describe("ReviewReason", () => {
  it("holds its snake_case codes in order", () => {
    expect(Enum.values(ReviewReason)).toEqual(["differs", "older_rule_version"]);
    expect(ReviewReason.OlderRuleVersion).toBe("older_rule_version");
  });

  it("types its values", () => {
    expectTypeOf<ReviewReason>().toEqualTypeOf<"differs" | "older_rule_version">();
  });
});
