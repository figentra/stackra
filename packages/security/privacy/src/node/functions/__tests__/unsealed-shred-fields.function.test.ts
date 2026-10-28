/**
 * Stackra file contract:
 * Purpose: unit tests of `unsealedShredFields`: a shredded field passes only when its model seals it under the key of
 *          the declaration's own subject property; a scope-sealed, a plain or a differently keyed field is named, and
 *          fields erased another way are never named.
 * Boundary: test only; stand-in models, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0212; gap gov2 (stackra-263).
 */
import { HasEncryptedFields, Model } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";

import { ErasureMethod } from "#contracts/enums/erasure-method.enum";
import { unsealedShredFields } from "#node/functions/unsealed-shred-fields.function";

class Profile extends Model.with(HasEncryptedFields({ subject: "userId" }, "email")) {
  userId!: string;

  email!: string | null;

  phone!: string | null;
}

class Contact extends Model.with(HasEncryptedFields("email")) {
  userId!: string;

  email!: string;
}

/** A declaration of `model` keyed by `subject` over `fields`. */
const declared = (
  model: object,
  subject: string,
  fields: Record<string, ErasureMethod>,
): Parameters<typeof unsealedShredFields>[0] => ({
  kind: "crm.thing",
  model: model as never,
  subject,
  fields,
});

describe(unsealedShredFields, () => {
  it("passes a field sealed under the declaration's subject", () => {
    expect(
      unsealedShredFields(
        declared(Profile, "userId", {
          email: ErasureMethod.Shred,
          phone: ErasureMethod.Anonymise,
        }),
      ),
    ).toEqual([]);
  });

  it("names a plain field, a scope-sealed field and a field keyed by another property", () => {
    expect(
      unsealedShredFields(declared(Profile, "userId", { phone: ErasureMethod.Shred })),
    ).toEqual(["crm.thing.phone"]);
    expect(
      unsealedShredFields(declared(Contact, "userId", { email: ErasureMethod.Shred })),
    ).toEqual(["crm.thing.email"]);
    expect(
      unsealedShredFields(declared(Profile, "ownerId", { email: ErasureMethod.Shred })),
    ).toEqual(["crm.thing.email"]);
  });
});
