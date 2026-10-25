/**
 * Stackra file contract:
 * Purpose: unit tests of `RuleSetChangedError`: a retryable Conflict refusal with code rule_set_changed that names the
 *          rule set in its envelope and requires it.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0331 (decision 5).
 */
import { Enum, type PublicId } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { RuleSetChangedError } from "#core/errors/rule-set-changed.error";

/** A rule set id. */
const RULE_SET = "rset_01j9z3k4m5n6p7q8r9s0t1v2w3" as PublicId<"rset">;

describe("RuleSetChangedError", () => {
  it("is a retryable Conflict refusal with code rule_set_changed", () => {
    const refused = RuleSetChangedError.create({ ruleSetId: RULE_SET });
    expect(isRefusal(refused, RuleSetChangedError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.Conflict);
    expect(refused.code).toBe("rule_set_changed");
    expect(refused.retryable).toBe(true);
    expect(Enum.meta(ErrorKind, refused.kind).httpStatus).toBe(409);
  });

  it("names the rule set in its envelope", () => {
    expect(RuleSetChangedError.envelope({ ruleSetId: RULE_SET })).toEqual({
      code: "rule_set_changed",
      category: "conflict",
      retryable: true,
      details: { ruleSetId: RULE_SET },
    });
  });

  it("requires the rule set", () => {
    // @ts-expect-error -- `ruleSetId` is required
    expect(RuleSetChangedError.create().code).toBe("rule_set_changed");
  });
});
