/**
 * Stackra file contract:
 * Purpose: unit tests of `@Classify`: each classified field records its data class, a subclass inherits them, and a
 *          non-model target is refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0341 (decisions 1 and 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { PrivilegedDataClass } from "#core/access/privileged.data-class";
import { Model } from "#core/bases/model.base";
import { Classify } from "#core/decorators/classify.decorator";

class AdviceNote extends Model {
  @Classify(PrivilegedDataClass)
  body = "";

  title = "";
}

class SignedAdviceNote extends AdviceNote {}

describe(Classify, () => {
  it("records the class of each classified field, inherited", () => {
    expect([...Classify.members(SignedAdviceNote)]).toEqual([["body", PrivilegedDataClass]]);
  });

  it("marks model fields only", () => {
    expect(() => {
      class NotAModel {
        @Classify(PrivilegedDataClass)
        body = "";
      }
      return NotAModel;
    }).toThrow(TypeError);
  });
});
