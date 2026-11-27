/**
 * Stackra file contract:
 * Purpose: unit tests of `DataClass` and the built-in `PrivilegedDataClass` and `CredentialDataClass`: a declared class
 *          carries its frozen key and eight effects as a static and is of the `data_class` kind; a key that is not
 *          snake_case, a missing effect and an unknown code are refused; `credential` is the contracts table's row.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0341 (decisions 1 to 3); ADR 0540 (decisions 1 and 2).
 */
import type { DataClassEffects } from "@stackra/contracts";
import { BUILT_IN_DATA_CLASSES, DATA_CLASSIFICATION_EFFECTS } from "@stackra/contracts";
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { CredentialDataClass } from "#core/access/credential.data-class";
import { PrivilegedDataClass } from "#core/access/privileged.data-class";
import { DataClass } from "#core/bases/data-class.base";
import { AiAudience } from "#core/enums/ai-audience.enum";
import { ExportLabel } from "#core/enums/export-label.enum";
import { FieldEncryption } from "#core/enums/field-encryption.enum";
import { MaskMethod } from "#core/enums/mask-method.enum";
import { RetentionBound } from "#core/enums/retention-bound.enum";
import { SearchSnippet } from "#core/enums/search-snippet.enum";
import { SubjectErasure } from "#core/enums/subject-erasure.enum";
import { SupportAccess } from "#core/enums/support-access.enum";
import type { DataClassOptions } from "#core/types/data-class-options.type";

const CLINICAL_NOTE = {
  key: "clinical_note",
  ai: AiAudience.Never,
  support: SupportAccess.Hidden,
  search: SearchSnippet.NoSnippet,
  export: ExportLabel.Labelled,
  encrypt: FieldEncryption.SubjectSealed,
  erasure: SubjectErasure.Shred,
  retention: RetentionBound.Required,
  mask: MaskMethod.Null,
} as const;

class ClinicalNoteDataClass extends DataClass(CLINICAL_NOTE) {}

/** The model's options and the contracts' codes are the same effects; this fails to compile if they drift. */
const sameEffects: [DataClassEffects, Omit<DataClassOptions, "key">] = [
  CLINICAL_NOTE,
  CLINICAL_NOTE,
];

describe(DataClass, () => {
  it("records the key and the eight effects on the class", () => {
    expect(ClinicalNoteDataClass.dataClass).toEqual(CLINICAL_NOTE);
    expect(Object.isFrozen(ClinicalNoteDataClass.dataClass)).toBe(true);
    expect(kindOf(ClinicalNoteDataClass)?.kind).toBe("data_class");
    expect(sameEffects).toHaveLength(2);
  });

  it("ships privileged with the access effects ADR 0341 fixes, kept out of erasure and masked copies", () => {
    expect(PrivilegedDataClass.dataClass).toEqual({
      key: "privileged",
      ai: "tenant_opt_in",
      support: "hidden",
      search: "no_snippet",
      export: "labelled",
      encrypt: "clear",
      erasure: "keep",
      retention: "none",
      mask: "null",
    });
  });

  it("ships credential as exactly the contracts table's credential row (ADR 0494)", () => {
    expect(CredentialDataClass.dataClass).toEqual({
      key: "credential",
      ...DATA_CLASSIFICATION_EFFECTS.credential,
    });
  });

  it("ships each built-in class exactly as its row of the contracts table gen reads (ADR 0540 decision 7)", () => {
    expect(CredentialDataClass.dataClass).toEqual(BUILT_IN_DATA_CLASSES.CredentialDataClass);
    expect(PrivilegedDataClass.dataClass).toEqual(BUILT_IN_DATA_CLASSES.PrivilegedDataClass);
  });

  it("refuses a key that is not snake_case", () => {
    expect(() => DataClass({ ...CLINICAL_NOTE, key: "ClinicalNote" })).toThrow(/snake_case/);
  });

  it("refuses a class that leaves an effect out or names an unknown code", () => {
    const { mask: _mask, ...noMask } = CLINICAL_NOTE;
    expect(() => DataClass(noMask as unknown as DataClassOptions)).toThrow(
      /clinical_note": mask must be one of keep, hash, fake, null, got undefined/,
    );
    expect(() =>
      DataClass({ ...CLINICAL_NOTE, encrypt: "rot13" as unknown as FieldEncryption }),
    ).toThrow(RangeError);
  });
});
