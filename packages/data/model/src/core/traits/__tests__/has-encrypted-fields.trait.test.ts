/**
 * Stackra file contract:
 * Purpose: unit tests of `HasEncryptedFields`: it records the encrypted field names (and the subject property when
 *          given), adds no field, and refuses an empty or repeated list, an empty subject or an encrypted subject.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0096; registry gap R-36.
 */
import { describe, expect, it } from "@stackra/testing";

import { Model } from "#core/bases/model.base";
import { traitsOf } from "#core/functions/traits-of.function";
import { HasEncryptedFields } from "#core/traits/has-encrypted-fields.trait";

class Profile extends Model.with(HasEncryptedFields({ subject: "userId" }, "email")) {
  userId!: string;

  email: string | null = null;
}

class Contact extends Model.with(HasEncryptedFields("email", "phone")) {
  email!: string;

  phone: string | null = null;
}

describe(HasEncryptedFields, () => {
  it("records the field names and adds no field", () => {
    expect(traitsOf(Contact)).toEqual([
      { name: "has_encrypted_fields", options: { fields: ["email", "phone"] } },
    ]);
    expect(Object.keys(new Contact())).toEqual(["email", "phone"]);
  });

  it("records the subject property of a subject-sealed model", () => {
    expect(traitsOf(Profile)).toEqual([
      { name: "has_encrypted_fields", options: { fields: ["email"], subject: "userId" } },
    ]);
  });

  it("refuses an empty or repeated list", () => {
    expect(() => HasEncryptedFields()).toThrow(TypeError);
    expect(() => HasEncryptedFields("email", "email")).toThrow(TypeError);
    expect(() => HasEncryptedFields({ subject: "userId" })).toThrow(TypeError);
  });

  it("refuses an empty subject and a subject that is itself encrypted", () => {
    expect(() => HasEncryptedFields({ subject: "" }, "email")).toThrow(TypeError);
    expect(() => HasEncryptedFields({ subject: "userId" }, "userId", "email")).toThrow(
      /subject the other fields are sealed for/,
    );
  });
});
