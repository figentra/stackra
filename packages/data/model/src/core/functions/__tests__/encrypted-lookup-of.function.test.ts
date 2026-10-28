/**
 * Stackra file contract:
 * Purpose: unit tests of `encryptedLookupOf`: the lookup fields of a model, and none for a model without them.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); gap gov9 (stackra-313).
 */
import { describe, expect, it } from "@stackra/testing";

import { Model } from "#core/bases/model.base";
import { encryptedLookupOf } from "#core/functions/encrypted-lookup-of.function";
import { HasEncryptedFields } from "#core/traits/has-encrypted-fields.trait";

class Lead extends Model.with(HasEncryptedFields({ lookup: ["email"] }, "email", "phone")) {
  email: string | null = null;

  emailBidx: string | null = null;

  phone: string | null = null;
}

class Contact extends Model.with(HasEncryptedFields("email")) {
  email: string | null = null;
}

describe(encryptedLookupOf, () => {
  it("reads the lookup fields, inherited by a subclass", () => {
    expect(encryptedLookupOf(Lead)).toEqual(["email"]);
    expect(encryptedLookupOf(class extends Lead {})).toEqual(["email"]);
  });

  it("is empty for a model without lookup fields or without the trait", () => {
    expect(encryptedLookupOf(Contact)).toEqual([]);
    expect(encryptedLookupOf(Model)).toEqual([]);
  });
});
