/**
 * Stackra file contract:
 * Purpose: unit tests of `AwardRevokedError`: a non-retryable FailedPrecondition refusal (412) with code
 *          `award_revoked` that names the award.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0368 (decisions 5 and 6); ADR 0140.
 */
import { Enum, type PublicId } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { AwardRevokedError } from "#core/errors/award-revoked.error";

/** An award id. */
const AWARD = "awd_01j9z3k4m5n6p7q8r9s0t1v2w3" as PublicId<"awd">;

describe("AwardRevokedError", () => {
  it("is a FailedPrecondition refusal with code award_revoked naming the award", () => {
    const refused = AwardRevokedError.create({ awardId: AWARD });
    expect(isRefusal(refused, AwardRevokedError)).toBe(true);
    expect(refused.code).toBe("award_revoked");
    expect(refused.retryable).toBe(false);
    expect(Enum.meta(ErrorKind, refused.kind).httpStatus).toBe(412);
    expect(AwardRevokedError.envelope({ awardId: AWARD })).toEqual({
      code: "award_revoked",
      category: "precondition_failed",
      retryable: false,
      details: { awardId: AWARD },
    });
  });
});
