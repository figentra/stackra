/**
 * Stackra file contract:
 * Purpose: unit tests of `registerAwardRecipients`: a row lands in the registry, registering the same rules again is
 *          harmless, and a malformed key or a key with other rules is refused.
 * Boundary: test only; clears the internal registry after each test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0368 (decisions 1 and 4).
 */
import { Rules } from "@stackra/rules";
import { afterEach, describe, expect, it } from "@stackra/testing";

import { AWARD_RECIPIENTS } from "#node/constants/award-recipients.constant";
import { registerAwardRecipients } from "#node/functions/register-award-recipients.function";

/** Two consumers' rules. */
const MEMBER_RULES = Rules.create({ key: "test.member_award", sources: [] });
const OTHER_RULES = Rules.create({ key: "test.other_award", sources: [] });

afterEach(() => {
  AWARD_RECIPIENTS.clear();
});

describe(registerAwardRecipients, () => {
  it("registers a model's rules, once or again", () => {
    registerAwardRecipients([{ model: "test.member", rules: MEMBER_RULES }]);
    registerAwardRecipients([{ model: "test.member", rules: MEMBER_RULES }]);
    expect(AWARD_RECIPIENTS.get("test.member")).toBe(MEMBER_RULES);
  });

  it("refuses a malformed key and a key with other rules", () => {
    expect(() => registerAwardRecipients([{ model: "Member", rules: MEMBER_RULES }])).toThrow(
      TypeError,
    );
    registerAwardRecipients([{ model: "test.member", rules: MEMBER_RULES }]);
    expect(() => registerAwardRecipients([{ model: "test.member", rules: OTHER_RULES }])).toThrow(
      /other rules/,
    );
  });
});
