/**
 * Stackra file contract:
 * Purpose: unit tests of `encryptedSubjectOf`: the subject property of a subject-sealed model, inherited by a subclass;
 *          undefined for a model sealed under the scope's key and for one without the trait.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0212; gap gov2 (stackra-263).
 */
import { describe, expect, it } from "@stackra/testing";

import { Model } from "#core/bases/model.base";
import { encryptedSubjectOf } from "#core/functions/encrypted-subject-of.function";
import { HasEncryptedFields } from "#core/traits/has-encrypted-fields.trait";

class Profile extends Model.with(HasEncryptedFields({ subject: "userId" }, "email")) {
  userId!: string;

  email: string | null = null;
}

class VipProfile extends Profile {}

class Contact extends Model.with(HasEncryptedFields("email")) {
  email!: string;
}

class Note extends Model {
  body!: string;
}

describe(encryptedSubjectOf, () => {
  it("reads the subject property, also through a subclass", () => {
    expect(encryptedSubjectOf(Profile)).toBe("userId");
    expect(encryptedSubjectOf(VipProfile)).toBe("userId");
  });

  it("is undefined for a scope-sealed model and a model without the trait", () => {
    expect(encryptedSubjectOf(Contact)).toBeUndefined();
    expect(encryptedSubjectOf(Note)).toBeUndefined();
  });
});
