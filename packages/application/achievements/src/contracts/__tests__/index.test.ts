/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: `GrantRefusal` is its one value, and the `RecipientRef`,
 *          `AwardRecipient`, `VerifiedAward` and `CertificateFields` types have the shapes consumers store and read.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0294 (decision 15); ADR 0368.
 */
import type { PublicId } from "@stackra/contracts";
import type { Rules } from "@stackra/rules";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type {
  AwardRecipient,
  CertificateFields,
  RecipientRef,
  VerifiedAward,
} from "#contracts/index";

describe("@stackra/achievements/contracts", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(contracts).sort()).toEqual(["GrantRefusal"]);
  });

  it("types a recipient, its registration, a verified award and a certificate", () => {
    expectTypeOf<RecipientRef>().toEqualTypeOf<{ readonly model: string; readonly id: string }>();
    expectTypeOf<AwardRecipient>().toEqualTypeOf<{
      readonly model: string;
      readonly rules: Rules;
    }>();
    expectTypeOf<VerifiedAward["awardId"]>().toEqualTypeOf<PublicId<"awd">>();
    expectTypeOf<VerifiedAward["recipient"]>().toEqualTypeOf<RecipientRef>();
    expectTypeOf<VerifiedAward["level"]>().toEqualTypeOf<string | null>();
    expectTypeOf<CertificateFields["template"]>().toEqualTypeOf<string | null>();
    expectTypeOf<CertificateFields["verifyQr"]>().toEqualTypeOf<string>();
  });
});
