/**
 * Stackra file contract:
 * Purpose: unit tests of `encryptedScopeOf`: the scope property of a scope-bound model, inherited by a subclass;
 *          undefined for a model bound to the field only and for one without the trait.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0476; gap gov8 (stackra-330).
 */
import { describe, expect, it } from "@stackra/testing";

import { Model } from "#core/bases/model.base";
import { encryptedScopeOf } from "#core/functions/encrypted-scope-of.function";
import { HasEncryptedFields } from "#core/traits/has-encrypted-fields.trait";

class Message extends Model.with(HasEncryptedFields({ scope: "scopeId" }, "content")) {
  scopeId!: string;

  content!: string;
}

class PinnedMessage extends Message {}

class Contact extends Model.with(HasEncryptedFields("email")) {
  email!: string;
}

class Note extends Model {
  body!: string;
}

describe(encryptedScopeOf, () => {
  it("reads the scope property, also through a subclass", () => {
    expect(encryptedScopeOf(Message)).toBe("scopeId");
    expect(encryptedScopeOf(PinnedMessage)).toBe("scopeId");
  });

  it("is undefined for a field-bound model and a model without the trait", () => {
    expect(encryptedScopeOf(Contact)).toBeUndefined();
    expect(encryptedScopeOf(Note)).toBeUndefined();
  });
});
