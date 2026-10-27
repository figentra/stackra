/**
 * Stackra file contract:
 * Purpose: unit tests of `semanticPassageOf`: the passage is the document's text fields one per line (every locale of
 *          a translated field), empty lines dropped; a text path ending at an `ai: never` field is refused, on the row
 *          itself and through a relation, while a `tenant_opt_in` field is not this guard's refusal.
 * Boundary: test only; rows are model instances with plain arrays standing in for populated collections.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0380 (decisions 2 and 3); STA-1326.
 */
import {
  AiAudience,
  Classify,
  DataClass,
  ExportLabel,
  Model,
  PrivilegedDataClass,
  SearchSnippet,
  SupportAccess,
  Translated,
} from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";

import { semanticPassageOf } from "#core/functions/semantic-passage-of.function";

class ClinicalNoteDataClass extends DataClass({
  key: "clinical_note",
  ai: AiAudience.Never,
  support: SupportAccess.Hidden,
  search: SearchSnippet.NoSnippet,
  export: ExportLabel.Labelled,
}) {}

class Finding extends Model.with() {
  @Classify(ClinicalNoteDataClass)
  detail = "";
}

class CaseNote extends Model.with() {
  @Classify(ClinicalNoteDataClass)
  body = "";

  @Classify(PrivilegedDataClass)
  advice = "";

  title: Translated | string = "";

  summary = "";

  findings: readonly Finding[] = [];
}

/** A note with the given fields. */
const noteWith = (fields: Partial<CaseNote>): CaseNote => Object.assign(new CaseNote(), fields);

describe(semanticPassageOf, () => {
  it("joins the text fields one per line, every locale of a translated field, without empty lines", () => {
    const note = noteWith({
      title: Translated.of({ en: "Unpaid Invoice", ar: "كتان" }),
      summary: "",
      advice: "Call the client",
    });
    expect(semanticPassageOf(note, { text: ["title", "summary", "advice"] })).toBe(
      "unpaid invoice\nكتان\ncall the client",
    );
  });

  it("is empty for a row with no text", () => {
    expect(semanticPassageOf(noteWith({}), { text: ["summary"] })).toBe("");
  });

  it("refuses a field whose data class says ai: never", () => {
    expect(() => semanticPassageOf(noteWith({ body: "x" }), { text: ["summary", "body"] })).toThrow(
      /searchable_semantic_ai_never: CaseNote\.body/,
    );
  });

  it("refuses an ai: never field reached through a relation, and not when the relation is empty", () => {
    const finding = Object.assign(new Finding(), { detail: "fracture" });
    expect(() =>
      semanticPassageOf(noteWith({ findings: [finding] }), { text: ["findings.detail"] }),
    ).toThrow(/CaseNote\.findings\.detail/);
    expect(semanticPassageOf(noteWith({}), { text: ["findings.detail"] })).toBe("");
  });
});
