/**
 * Stackra file contract:
 * Purpose: unit tests of `recipientRulesOf`: the rules of a registered model, and `recipient: recipient_unknown` for
 *          any other.
 * Boundary: test only; clears the internal registry after each test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0368 (decisions 1 and 4).
 */
import { InputInvalidError } from "@stackra/actions";
import { Rules } from "@stackra/rules";
import { type FactField, type FactSource, FieldType } from "@stackra/rules/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";

import { AWARD_RECIPIENTS } from "#node/constants/award-recipients.constant";
import { recipientRulesOf } from "#node/functions/recipient-rules-of.function";

/** The one fact source `Rules.create` requires. */
const SOURCES: FactSource[] = [
  {
    key: "member",
    fields: { sales: { type: FieldType.Number, label: "test::facts.sales" as FactField["label"] } },
  },
];
const RULES = Rules.create({ key: "test.member_award", sources: SOURCES });

afterEach(() => {
  AWARD_RECIPIENTS.clear();
});

describe(recipientRulesOf, () => {
  it("reads a registered model's rules and refuses an unknown one", () => {
    AWARD_RECIPIENTS.set("test.member", RULES);
    expect(recipientRulesOf("test.member")).toBe(RULES);
    let refused: unknown;
    try {
      recipientRulesOf("test.unknown");
    } catch (error) {
      refused = error;
    }
    expect(refused).toBeInstanceOf(InputInvalidError);
    expect((refused as InputInvalidError).fieldErrors).toEqual({ recipient: "recipient_unknown" });
  });
});
