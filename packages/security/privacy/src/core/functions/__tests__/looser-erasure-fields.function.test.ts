/**
 * Stackra file contract:
 * Purpose: unit tests of `looserErasureFields`: a declared method passes when it is at least as strong as its field's
 *          data class (`delete` and `shred` rank together), fails below it, and a field with no class takes any method.
 * Boundary: test only; resolved declarations are built by hand.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0540 (decisions 3 and 5).
 */
import { DataClassification } from "@stackra/contracts";
import {
  AiAudience,
  Classify,
  DataClass,
  ExportLabel,
  FieldEncryption,
  MaskMethod,
  Model,
  RetentionBound,
  SearchSnippet,
  SubjectErasure,
  SupportAccess,
} from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";
import { Classified } from "@stackra/validation";

import { ErasureMethod } from "#contracts/enums/erasure-method.enum";
import { looserErasureFields } from "#core/functions/looser-erasure-fields.function";

/** A class whose fields are shredded with the subject's key. */
class ClinicalNoteDataClass extends DataClass({
  key: "clinical_note",
  ai: AiAudience.Never,
  support: SupportAccess.Hidden,
  search: SearchSnippet.NoSnippet,
  export: ExportLabel.Labelled,
  encrypt: FieldEncryption.SubjectSealed,
  erasure: SubjectErasure.Shred,
  retention: RetentionBound.Required,
  mask: MaskMethod.Null,
}) {}

class Visit extends Model {
  @Classify(ClinicalNoteDataClass)
  note!: string | null;

  @Classified(DataClassification.Personal)
  name!: string | null;

  room!: string | null;
}

const declared = (fields: Record<string, ErasureMethod>) => ({
  kind: "clinic.visit",
  model: Visit,
  subject: "userId",
  fields,
});

describe(looserErasureFields, () => {
  it("passes a method as strong as the class, or stronger, and any method on an unclassified field", () => {
    expect(
      looserErasureFields(
        declared({
          note: ErasureMethod.Delete,
          name: ErasureMethod.Anonymise,
          room: ErasureMethod.Anonymise,
        }),
      ),
    ).toEqual([]);
    expect(looserErasureFields(declared({ name: ErasureMethod.Shred }))).toEqual([]);
  });

  it("names a field erased more weakly than its class says", () => {
    expect(looserErasureFields(declared({ note: ErasureMethod.Anonymise }))).toEqual([
      "clinic.visit.note (anonymise below shred)",
    ]);
  });
});
