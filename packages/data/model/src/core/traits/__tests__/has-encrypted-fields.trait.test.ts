/**
 * Stackra file contract:
 * Purpose: unit tests of `HasEncryptedFields`: it records the encrypted field names (and the subject property when
 *          given, and the lookup fields), adds no field, and refuses an empty or repeated list, an empty subject, an
 *          encrypted subject, empty options, and a lookup that is empty, repeated, not encrypted or subject-sealed; it records
 *          the scope property and refuses an empty or encrypted one.
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

class Lead extends Model.with(HasEncryptedFields({ lookup: ["email"] }, "email", "phone")) {
  email: string | null = null;

  emailBidx: string | null = null;

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

  it("records the lookup fields", () => {
    expect(traitsOf(Lead)).toEqual([
      { name: "has_encrypted_fields", options: { fields: ["email", "phone"], lookup: ["email"] } },
    ]);
  });

  it("refuses empty options and a lookup that is empty, repeated, not encrypted or subject-sealed", () => {
    expect(() => HasEncryptedFields({}, "email")).toThrow(TypeError);
    expect(() => HasEncryptedFields({ lookup: [] }, "email")).toThrow(TypeError);
    expect(() => HasEncryptedFields({ lookup: ["email", "email"] }, "email")).toThrow(TypeError);
    expect(() => HasEncryptedFields({ lookup: ["name"] }, "email")).toThrow(
      /does not encrypt: name/,
    );
    expect(() => HasEncryptedFields({ subject: "userId", lookup: ["email"] }, "email")).toThrow(
      /outlive the shred/,
    );
  });

  it("records the scope property, alone or with a subject or lookup fields", () => {
    class Message extends Model.with(HasEncryptedFields({ scope: "scopeId" }, "content")) {
      scopeId!: string;

      content!: string;
    }
    expect(traitsOf(Message)).toEqual([
      { name: "has_encrypted_fields", options: { fields: ["content"], scope: "scopeId" } },
    ]);
    expect(() =>
      HasEncryptedFields({ scope: "scopeId", subject: "userId" }, "email"),
    ).not.toThrow();
    expect(() =>
      HasEncryptedFields({ scope: "scopeId", lookup: ["email"] }, "email"),
    ).not.toThrow();
  });

  it("refuses an empty scope and a scope that is itself encrypted", () => {
    expect(() => HasEncryptedFields({ scope: "" }, "content")).toThrow(TypeError);
    expect(() => HasEncryptedFields({ scope: "scopeId" }, "scopeId", "content")).toThrow(
      /scope the other fields are bound to/,
    );
  });
});
