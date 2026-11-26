/**
 * Stackra file contract:
 * Purpose: unit tests of `refuseEncryptedSearchPath` and its use by `searchDocumentOf` and `semanticPassageOf`: a
 *          path that ends at a field `HasEncryptedFields` names is refused on the row itself, through a relation and on
 *          a subclass, as a text, filter, sortable or range path; a plain field, an empty relation and a path that only
 *          shares the encrypted field's name with another model's field pass.
 * Boundary: test only; rows are model instances with plain arrays standing in for populated collections.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0465 (decision 5); ADR 0221; STA-2241.
 */
import { HasEncryptedFields, Model } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";

import { refuseEncryptedSearchPath } from "#core/functions/refuse-encrypted-search-path.function";
import { searchDocumentOf } from "#core/functions/search-document-of.function";
import { semanticPassageOf } from "#core/functions/semantic-passage-of.function";

class Allergy extends Model.with(HasEncryptedFields("reaction")) {
  reaction = "";

  label = "";
}

class Patient extends Model.with(HasEncryptedFields("diagnosis", "nationalId")) {
  displayName = "";

  diagnosis = "";

  nationalId = "";

  allergies: readonly Allergy[] = [];
}

class Outpatient extends Patient {}

/** A patient with the given fields. */
const patientWith = (fields: Partial<Patient>): Patient => Object.assign(new Patient(), fields);

/** An allergy with the given fields. */
const allergyWith = (fields: Partial<Allergy>): Allergy => Object.assign(new Allergy(), fields);

describe(refuseEncryptedSearchPath, () => {
  it("refuses a field the row's own model encrypts, naming the gen code", () => {
    expect(() =>
      refuseEncryptedSearchPath(patientWith({ diagnosis: "asthma" }), "diagnosis"),
    ).toThrow(/searchable_field_encrypted: Patient\.diagnosis ends at Patient\.diagnosis/);
  });

  it("refuses an encrypted field reached through a relation, and not while the relation is empty", () => {
    const patient = patientWith({ allergies: [allergyWith({ reaction: "anaphylaxis" })] });
    expect(() => refuseEncryptedSearchPath(patient, "allergies.reaction")).toThrow(
      /searchable_field_encrypted: Patient\.allergies\.reaction ends at Allergy\.reaction/,
    );
    expect(() => refuseEncryptedSearchPath(patientWith({}), "allergies.reaction")).not.toThrow();
  });

  it("refuses a field an ancestor model encrypts", () => {
    expect(() => refuseEncryptedSearchPath(new Outpatient(), "nationalId")).toThrow(
      /searchable_field_encrypted: Outpatient\.nationalId/,
    );
  });

  it("passes a plain field on an encrypted model and a related model's plain field", () => {
    const patient = patientWith({ allergies: [allergyWith({ label: "peanut" })] });
    expect(() => refuseEncryptedSearchPath(patient, "displayName")).not.toThrow();
    expect(() => refuseEncryptedSearchPath(patient, "allergies.label")).not.toThrow();
  });
});

describe("the guard in the document and the passage", () => {
  const patient = patientWith({
    displayName: "Sara",
    diagnosis: "asthma",
    nationalId: "784-1990-1234567-1",
    allergies: [allergyWith({ reaction: "anaphylaxis", label: "peanut" })],
  });

  it("refuses an encrypted field as a text, filter, sortable or range path before any plain text is read", () => {
    expect(() =>
      searchDocumentOf(patient, "pat_1", { text: ["displayName", "diagnosis"] }),
    ).toThrow(/searchable_field_encrypted: Patient\.diagnosis/);
    expect(() =>
      searchDocumentOf(patient, "pat_1", { text: ["displayName"], filters: ["nationalId"] }),
    ).toThrow(/searchable_field_encrypted: Patient\.nationalId/);
    expect(() =>
      searchDocumentOf(patient, "pat_1", { text: ["displayName"], sortable: ["diagnosis"] }),
    ).toThrow(/searchable_field_encrypted/);
    expect(() =>
      searchDocumentOf(patient, "pat_1", { text: ["displayName"], ranges: ["allergies.reaction"] }),
    ).toThrow(/searchable_field_encrypted: Patient\.allergies\.reaction/);
  });

  it("refuses an encrypted field in the passage a semantic facet embeds", () => {
    expect(() =>
      semanticPassageOf(patient, { text: ["allergies.reaction"], semantic: true }),
    ).toThrow(/searchable_field_encrypted/);
  });

  it("still builds the document of the plain fields", () => {
    expect(
      searchDocumentOf(patient, "pat_1", { text: ["displayName", "allergies.label"], filters: [] }),
    ).toEqual({ id: "pat_1", fields: ["sara", "peanut"], filters: {} });
  });
});
