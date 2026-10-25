/**
 * Stackra file contract:
 * Purpose: unit tests of `AwardNotGrantableError`: a non-retryable FailedPrecondition refusal (412) with code
 *          `award_not_grantable` that names the kind and the refusal code.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0368 (decision 3); ADR 0140.
 */
import { Enum, type PublicId } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { GrantRefusal } from "#contracts/index";
import { AwardNotGrantableError } from "#core/errors/award-not-grantable.error";

/** A kind id. */
const KIND = "awk_01j9z3k4m5n6p7q8r9s0t1v2w3" as PublicId<"awk">;

describe("AwardNotGrantableError", () => {
  it("is a FailedPrecondition refusal with code award_not_grantable", () => {
    const refused = AwardNotGrantableError.create({
      kindId: KIND,
      reason: GrantRefusal.KindArchived,
    });
    expect(isRefusal(refused, AwardNotGrantableError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.FailedPrecondition);
    expect(refused.code).toBe("award_not_grantable");
    expect(refused.retryable).toBe(false);
    expect(Enum.meta(ErrorKind, refused.kind).httpStatus).toBe(412);
  });

  it("names the kind and the reason in its envelope", () => {
    expect(
      AwardNotGrantableError.envelope({ kindId: KIND, reason: GrantRefusal.PeriodTaken }),
    ).toEqual({
      code: "award_not_grantable",
      category: "precondition_failed",
      retryable: false,
      details: { kindId: KIND, reason: "period_taken" },
    });
  });
});
