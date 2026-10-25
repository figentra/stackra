/**
 * Stackra file contract:
 * Purpose: unit tests of `@Classified`: it records the data classification of a field, readable by erasure, export and
 *          the access log, merges a subclass's fields over its parent's, and is refused on a class or outside the
 *          shape kinds.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (amendment item 3);
 *                     ADR 0134.
 */
import { DataClassification } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Schema } from "#core/bases/schema.base";
import { Classified } from "#core/decorators/classified.decorator";
import { Str } from "#core/decorators/str.decorator";

class AccountView extends Schema {
  @Classified(DataClassification.Pseudonymous)
  @Str({ max: 64 })
  memberId!: string;

  @Classified(DataClassification.Financial)
  balance = 0;
}

class AccountDetail extends AccountView {
  @Classified(DataClassification.Personal)
  email!: string;
}

describe("Classified", () => {
  it("records the classification of each field", () => {
    expect(Classified.members(AccountView).get("memberId")).toBe("pseudonymous");
    expect(Classified.members(AccountView).get("balance")).toBe("financial");
  });

  it("reads a subclass's fields with its parent's", () => {
    expect(Object.fromEntries(Classified.members(AccountDetail))).toEqual({
      memberId: "pseudonymous",
      balance: "financial",
      email: "personal",
    });
  });

  it("is a field decorator of the shape kinds", () => {
    expect([Classified.kind, Classified.target]).toEqual(["classified", "field"]);
    expect(() => {
      @Classified(DataClassification.Personal)
      class Whole extends Schema {}
      return Whole;
    }).toThrow(/@classified decorates a field, not a class/);
  });
});
