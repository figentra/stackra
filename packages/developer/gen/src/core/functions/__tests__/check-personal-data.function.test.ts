/**
 * Stackra file contract:
 * Purpose: unit tests of `checkPersonalData`: a declaration that meets its model passes; an unknown field, a credential
 *          field, a method weaker than the field's class, a shred outside the subject's sealing and an anonymise on a
 *          field that cannot hold null are refused; a declaration that lists no fields is checked on the fields its
 *          model's classes derive; another package's model is left to its own gen.
 * Boundary: test only; pure IR in, refusals out.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0540 (decision 5); ADR 0494 (rule 4); data-layer gap gov2.
 */
import { describe, expect, it } from "@stackra/testing";

import { checkPersonalData } from "#core/functions/check-personal-data.function";
import { DATA_CLASS_IR } from "#core/__tests__/fixtures/data-class-ir.fixture";

const { CLINICAL_NOTE, classify, field, irOf, model, personalData, shapeOf } = DATA_CLASS_IR;

/** `Patient`, sealing `note` under the `userId` subject's key, with a nullable name and a required ward. */
const PATIENT = model(
  "Patient",
  [{ name: "HasEncryptedFields", args: [{ subject: "userId" }, "note"] }],
  [classify("note", CLINICAL_NOTE)],
);
const SHAPE = shapeOf(PATIENT, [
  field("userId"),
  field("name", "personal"),
  field("ward", "personal", false),
  field("note"),
  field("token", "credential"),
  field("room"),
]);

/** The refusals for a declaration of `Patient`, as `code subject`. */
const refused = (subject: string, fields?: Readonly<Record<string, string>>): string[] =>
  checkPersonalData(irOf([PATIENT, personalData("Patient", subject, fields)], [SHAPE])).map(
    (error) => `${error.code} ${error.subject}`,
  );

describe(checkPersonalData, () => {
  it("passes a declaration that meets its model and the model's classes", () => {
    expect(refused("userId", { name: "anonymise", note: "shred", room: "delete" })).toEqual([]);
  });

  it("refuses a field the model does not declare, and a credential field", () => {
    expect(refused("userId", { email: "delete", token: "delete" })).toEqual([
      "personal_data_field_unknown PatientPersonalData.email",
      "personal_data_credential_field PatientPersonalData.token",
    ]);
  });

  it("refuses a method weaker than the field's data class", () => {
    expect(refused("userId", { note: "anonymise" })).toEqual([
      "personal_data_looser_than_class PatientPersonalData.note",
    ]);
  });

  it("refuses a shred the model does not seal under the declaration's subject", () => {
    expect(refused("ownerId", { note: "shred" })).toEqual([
      "personal_data_shred_unsealed PatientPersonalData.note",
    ]);
    expect(refused("userId", { name: "shred" })).toEqual([
      "personal_data_shred_unsealed PatientPersonalData.name",
    ]);
  });

  it("refuses an anonymise on a field that cannot hold null", () => {
    expect(refused("userId", { ward: "anonymise" })).toEqual([
      "personal_data_anonymise_not_nullable PatientPersonalData.ward",
    ]);
  });

  it("checks a declaration without fields on the fields its model's classes derive", () => {
    // name and ward anonymise (personal), note shreds (clinical_note); the token is kept, the room unclassified.
    expect(refused("userId")).toEqual([
      "personal_data_anonymise_not_nullable PatientPersonalData.ward",
    ]);
    expect(refused("ownerId")).toEqual([
      "personal_data_anonymise_not_nullable PatientPersonalData.ward",
      "personal_data_shred_unsealed PatientPersonalData.note",
    ]);
  });

  it("leaves a declaration of a model the member does not own to that model's gen", () => {
    expect(
      checkPersonalData(irOf([personalData("Customer", "userId", { email: "anonymise" })], [])),
    ).toEqual([]);
  });
});
