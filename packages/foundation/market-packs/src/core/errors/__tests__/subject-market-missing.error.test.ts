/**
 * Stackra file contract:
 * Purpose: unit tests of `SubjectMarketMissingError`: a FailedPrecondition refusal with code subject_market_missing that
 *          names the subject and the rule kind.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0385.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { PackSubject } from "#core/enums/pack-subject.enum";
import { SubjectMarketMissingError } from "#core/errors/subject-market-missing.error";

describe("SubjectMarketMissingError", () => {
  it("is a FailedPrecondition refusal with code subject_market_missing", () => {
    const refused = SubjectMarketMissingError.create({
      subject: PackSubject.Buyer,
      ruleKind: "tax.sales",
    });
    expect(isRefusal(refused, SubjectMarketMissingError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.FailedPrecondition);
    expect(refused.code).toBe("subject_market_missing");
  });

  it("names the subject and the rule kind in its envelope", () => {
    expect(
      SubjectMarketMissingError.envelope({ subject: PackSubject.Entity, ruleKind: "registration" })
        .details,
    ).toEqual({ subject: "entity", ruleKind: "registration" });
  });
});
