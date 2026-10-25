/**
 * Stackra file contract:
 * Purpose: unit tests of `HasEncryptedFields`: it records the encrypted field names, adds no field, and refuses an
 *          empty or repeated list.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0096; registry gap R-36.
 */
import { describe, expect, it } from "@stackra/testing";

import { Model } from "#core/bases/model.base";
import { traitsOf } from "#core/functions/traits-of.function";
import { HasEncryptedFields } from "#core/traits/has-encrypted-fields.trait";

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

  it("refuses an empty or repeated list", () => {
    expect(() => HasEncryptedFields()).toThrow(TypeError);
    expect(() => HasEncryptedFields("email", "email")).toThrow(TypeError);
  });
});
