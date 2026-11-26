/**
 * Stackra file contract:
 * Purpose: unit tests of `personalDataDeclarations`: a declaration that lists no fields takes them from the model's
 *          data classes (every classified field whose class erases, with its method); a listed field list is kept as
 *          written; a field the model classifies `credential` (by `@Classified` or `@Classify`) is left out of every
 *          declaration, so neither the subject-access export nor erasure reads it; and a declaration left with no
 *          field is omitted.
 * Boundary: test only; clears the registry after each case.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0494 (rule 4); ADR 0540 (decision 5).
 */
import { DataClassification } from "@stackra/contracts";
import {
  AiAudience,
  Classify,
  CredentialDataClass,
  DataClass,
  ExportLabel,
  FieldEncryption,
  MaskMethod,
  Model,
  PrivilegedDataClass,
  RetentionBound,
  SearchSnippet,
  SubjectErasure,
  SupportAccess,
} from "@stackra/model";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { Classified } from "@stackra/validation";

import { ErasureMethod } from "#contracts/enums/erasure-method.enum";
import { PersonalData } from "#core/bases/personal-data.base";
import { personalDataDeclarations } from "#core/functions/personal-data-declarations.function";
import { registerPersonalData } from "#core/functions/register-personal-data.function";
import { clearPersonalData } from "#testing/clear-personal-data.function";

class Connection extends Model {
  @Classified(DataClassification.Personal)
  accountEmail!: string | null;

  @Classified(DataClassification.Credential)
  accessToken!: string | null;

  id!: string;

  userId!: string;
}

class Secret extends Model {
  @Classified(DataClassification.Credential)
  apiKey!: string | null;

  id!: string;

  userId!: string;
}

/** A class whose fields leave with their row. */
class CaseFileDataClass extends DataClass({
  key: "case_file",
  ai: AiAudience.Never,
  support: SupportAccess.Hidden,
  search: SearchSnippet.NoSnippet,
  export: ExportLabel.Labelled,
  encrypt: FieldEncryption.Clear,
  erasure: SubjectErasure.Delete,
  retention: RetentionBound.None,
  mask: MaskMethod.Null,
}) {}

class Patient extends Model {
  @Classified(DataClassification.Personal)
  name!: string | null;

  @Classified(DataClassification.Pseudonymous)
  doctorId!: string | null;

  @Classify(CaseFileDataClass)
  caseSummary!: string | null;

  @Classify(PrivilegedDataClass)
  counselNote!: string | null;

  @Classify(CredentialDataClass)
  portalToken!: string | null;

  id!: string;

  userId!: string;

  ward!: string;
}

class ConnectionPersonalData extends PersonalData({
  model: () => Connection,
  subject: "userId",
  fields: { accountEmail: ErasureMethod.Anonymise, accessToken: ErasureMethod.Delete },
}) {}

class SecretPersonalData extends PersonalData({
  model: () => Secret,
  subject: "userId",
  fields: { apiKey: ErasureMethod.Delete },
}) {}

class PatientPersonalData extends PersonalData({
  model: () => Patient,
  subject: "userId",
}) {}

class PatientNamePersonalData extends PersonalData({
  model: () => Patient,
  subject: "userId",
  fields: { name: ErasureMethod.Delete, portalToken: ErasureMethod.Delete },
}) {}

afterEach(() => clearPersonalData());

describe("personalDataDeclarations and credentials", () => {
  it("leaves a credential field out, so export and erasure never read it", () => {
    registerPersonalData("integrations", [ConnectionPersonalData]);
    expect(personalDataDeclarations().map(({ fields }) => fields)).toEqual([
      { accountEmail: "anonymise" },
    ]);
  });

  it("omits a declaration whose fields are all credentials", () => {
    registerPersonalData("integrations", [ConnectionPersonalData, SecretPersonalData]);
    expect(personalDataDeclarations().map(({ model }) => model)).toEqual([Connection]);
  });
});

describe("personalDataDeclarations derived from the data classes", () => {
  it("takes every field whose class erases, with the class's method, when the declaration lists none", () => {
    registerPersonalData("clinic", [PatientPersonalData]);
    expect(personalDataDeclarations()).toEqual([
      {
        kind: "clinic.patient",
        model: Patient,
        subject: "userId",
        fields: { name: "anonymise", doctorId: "anonymise", caseSummary: "delete" },
      },
    ]);
  });

  it("keeps a listed field list as written, still without a @Classify credential", () => {
    registerPersonalData("clinic", [PatientNamePersonalData]);
    expect(personalDataDeclarations().map(({ fields }) => fields)).toEqual([{ name: "delete" }]);
  });

  it("omits a derived declaration whose model holds no erasable field", () => {
    registerPersonalData("integrations", [
      PersonalData({ model: () => Secret, subject: "userId" }),
    ]);
    expect(personalDataDeclarations()).toEqual([]);
  });
});
