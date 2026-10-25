/**
 * Stackra file contract:
 * Purpose: unit tests of `encryptedFieldsOf`: it reads the fields named by `HasEncryptedFields`, through a subclass
 *          too, and gives none for a model without the trait.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0096; registry gap R-36.
 */
import { describe, expect, it } from "@stackra/testing";

import { Model } from "#core/bases/model.base";
import { encryptedFieldsOf } from "#core/functions/encrypted-fields-of.function";
import { HasEncryptedFields } from "#core/traits/has-encrypted-fields.trait";
import { Timestamps } from "#core/traits/timestamps.trait";

class Contact extends Model.with(Timestamps, HasEncryptedFields("email", "phone")) {}

class Lead extends Contact {}

class Note extends Model.with(Timestamps) {}

describe(encryptedFieldsOf, () => {
  it("reads the encrypted fields of a model and its subclasses", () => {
    expect(encryptedFieldsOf(Contact)).toEqual(["email", "phone"]);
    expect(encryptedFieldsOf(Lead)).toEqual(["email", "phone"]);
  });

  it("gives none for a model without the trait", () => {
    expect(encryptedFieldsOf(Note)).toEqual([]);
  });
});
