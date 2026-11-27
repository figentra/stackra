/**
 * Stackra file contract:
 * Purpose: unit tests of `checkPersonalData`: a declaration that meets its model passes; an unknown field, a credential
 *          field, a method weaker than the field's class, a shred outside the subject's sealing and an anonymise on a
 *          field that cannot hold null are refused; a declaration that lists no fields is checked on the fields its
 *          model's classes derive, and refused (`personal_data_no_fields`) when none derive and none are listed;
 *          another package's model is left to its own gen.
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

  it("refuses a declaration left with no field: none listed and none derived, or an empty list", () => {
    const LOG = model("AuditLine");
    const LOG_SHAPE = shapeOf(LOG, [field("userId"), field("token", "credential"), field("room")]);
    const noFields = (fields?: Readonly<Record<string, string>>) =>
      checkPersonalData(irOf([LOG, personalData("AuditLine", "userId", fields)], [LOG_SHAPE])).map(
        (error) => `${error.code} ${error.subject}`,
      );
    // only a credential (kept) and an unclassified field: no class derives an erasing field
    expect(noFields()).toEqual(["personal_data_no_fields AuditLinePersonalData"]);
    expect(noFields({})).toEqual(["personal_data_no_fields AuditLinePersonalData"]);
    expect(refused("userId", {})).toEqual(["personal_data_no_fields PatientPersonalData"]);
  });

  it("derives the fields of a built-in @Classify class gen read by package (ADR 0540 decision 7)", () => {
    const CONNECTION = model(
      "Connection",
      [],
      [
        classify("accessToken", {
          key: "credential",
          ai: "never",
          support: "hidden",
          search: "no_snippet",
          export: "excluded",
          encrypt: "sealed",
          erasure: "keep",
          retention: "none",
          mask: "null",
        }),
        classify("email", { ...CLINICAL_NOTE, key: "contact", erasure: "anonymise" }),
      ],
    );
    const SHAPE_C = shapeOf(CONNECTION, [field("userId"), field("accessToken"), field("email")]);
    // the credential is kept out, the contact field derives an anonymise: one field, no refusal
    expect(
      checkPersonalData(irOf([CONNECTION, personalData("Connection", "userId")], [SHAPE_C])),
    ).toEqual([]);
    // with only the credential classified, nothing is derived
    const ONLY_SECRET = model("Connection", [], CONNECTION.facets.slice(0, 1));
    expect(
      checkPersonalData(irOf([ONLY_SECRET, personalData("Connection", "userId")], [SHAPE_C])).map(
        (error) => error.code,
      ),
    ).toEqual(["personal_data_no_fields"]);
  });

  it("leaves a declaration of a model the member does not own to that model's gen", () => {
    expect(
      checkPersonalData(irOf([personalData("Customer", "userId", { email: "anonymise" })], [])),
    ).toEqual([]);
  });
});
