/**
 * Stackra file contract:
 * Purpose: unit tests of `DataClass` and the built-in `PrivilegedDataClass` and `CredentialDataClass`: a declared class carries its frozen key
 *          and effects as a static and is of the `data_class` kind; a key that is not snake_case is refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0341 (decisions 1 to 3).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { CredentialDataClass } from "#core/access/credential.data-class";
import { PrivilegedDataClass } from "#core/access/privileged.data-class";
import { DataClass } from "#core/bases/data-class.base";
import { AiAudience } from "#core/enums/ai-audience.enum";
import { ExportLabel } from "#core/enums/export-label.enum";
import { SearchSnippet } from "#core/enums/search-snippet.enum";
import { SupportAccess } from "#core/enums/support-access.enum";

class ClinicalNoteDataClass extends DataClass({
  key: "clinical_note",
  ai: AiAudience.Never,
  support: SupportAccess.Hidden,
  search: SearchSnippet.NoSnippet,
  export: ExportLabel.Labelled,
}) {}

describe(DataClass, () => {
  it("records the key and effects on the class", () => {
    expect(ClinicalNoteDataClass.dataClass.key).toBe("clinical_note");
    expect(Object.isFrozen(ClinicalNoteDataClass.dataClass)).toBe(true);
    expect(kindOf(ClinicalNoteDataClass)?.kind).toBe("data_class");
  });

  it("ships privileged with the effects ADR 0341 fixes", () => {
    expect(PrivilegedDataClass.dataClass).toEqual({
      key: "privileged",
      ai: "tenant_opt_in",
      support: "hidden",
      search: "no_snippet",
      export: "labelled",
    });
  });

  it("ships credential with the strictest effect on every axis (ADR 0494)", () => {
    expect(CredentialDataClass.dataClass).toEqual({
      key: "credential",
      ai: "never",
      support: "hidden",
      search: "no_snippet",
      export: "excluded",
    });
  });

  it("refuses a key that is not snake_case", () => {
    expect(() =>
      DataClass({
        key: "ClinicalNote",
        ai: AiAudience.Allowed,
        support: SupportAccess.Visible,
        search: SearchSnippet.Snippet,
        export: ExportLabel.Labelled,
      }),
    ).toThrow(/snake_case/);
  });
});
