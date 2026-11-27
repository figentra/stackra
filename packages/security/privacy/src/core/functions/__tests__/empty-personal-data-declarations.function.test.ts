/**
 * Stackra file contract:
 * Purpose: unit tests of `emptyPersonalDataDeclarations`: a declaration that lists no fields and whose model's classes
 *          derive none is empty (`PersonalData` itself refuses an empty list); a declaration with listed fields, or one
 *          whose model's classes derive an erasing field, is not.
 * Boundary: test only; clears the registry after each case.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0540 (decision 5: erasure fails closed).
 */
import { DataClassification } from "@stackra/contracts";
import { Model } from "@stackra/model";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { Classified } from "@stackra/validation";

import { ErasureMethod } from "#contracts/enums/erasure-method.enum";
import { PersonalData } from "#core/bases/personal-data.base";
import { emptyPersonalDataDeclarations } from "#core/functions/empty-personal-data-declarations.function";
import { registerPersonalData } from "#core/functions/register-personal-data.function";
import { clearPersonalData } from "#testing/clear-personal-data.function";

/** Only a credential and an unclassified field: nothing a class erases. */
class Secret extends Model {
  @Classified(DataClassification.Credential)
  apiKey!: string | null;

  note!: string | null;

  id!: string;

  userId!: string;
}

/** A personal field its class anonymises. */
class Contact extends Model {
  @Classified(DataClassification.Personal)
  email!: string | null;

  id!: string;

  userId!: string;
}

class SecretPersonalData extends PersonalData({
  model: () => Secret,
  subject: "userId",
}) {}

class SecretNotePersonalData extends PersonalData({
  model: () => Secret,
  subject: "userId",
  fields: { note: ErasureMethod.Delete },
}) {}

class ContactPersonalData extends PersonalData({
  model: () => Contact,
  subject: "userId",
}) {}

afterEach(() => {
  clearPersonalData();
});

describe(emptyPersonalDataDeclarations, () => {
  it("names a declaration with no listed fields whose model's classes derive none", () => {
    registerPersonalData("integrations", [SecretPersonalData, ContactPersonalData]);
    expect(emptyPersonalDataDeclarations()).toEqual(["SecretPersonalData"]);
  });

  it("names none when every declaration lists or derives a field", () => {
    registerPersonalData("crm", [SecretNotePersonalData, ContactPersonalData]);
    expect(emptyPersonalDataDeclarations()).toEqual([]);
  });
});
