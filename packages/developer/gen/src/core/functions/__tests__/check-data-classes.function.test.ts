/**
 * Stackra file contract:
 * Purpose: unit tests of `fieldDataClassOf` and `checkDataClasses`: a field's effective class from `@Classified`, from
 *          `@Classify` or the stricter of both; a `@Classify` class missing an effect, one looser than the field's
 *          `@Classified` class, and a model holding a retention-bound field without `Retention` are refused; and
 *          `generateMember` refuses on them in the full pass.
 * Boundary: test only; pure IR in, refusals out.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0540 (decisions 1, 3 and 4); ADR 0341.
 */
import { DATA_CLASSIFICATION_EFFECTS } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { checkDataClasses } from "#core/functions/check-data-classes.function";
import { fieldDataClassOf } from "#core/functions/field-data-class-of.function";
import { generateMember } from "#core/functions/generate-member.function";
import { DATA_CLASS_IR } from "#core/__tests__/fixtures/data-class-ir.fixture";

const { CLINICAL_NOTE, classify, field, irOf, model, shapeOf } = DATA_CLASS_IR;

const RETENTION = { name: "Retention", args: [{ basis: "createdAt", policy: "hard" }] };

/** The refusals of `checkDataClasses`, as `code subject`. */
const refused = (...args: Parameters<typeof irOf>): string[] =>
  checkDataClasses(irOf(...args)).map((error) => `${error.code} ${error.subject}`);

describe(fieldDataClassOf, () => {
  it("reads the @Classified row, the @Classify class, or the stricter of both under the @Classify key", () => {
    const declared = model("Visit", [], [classify("note", CLINICAL_NOTE)]);
    const { key: _key, ...effects } = CLINICAL_NOTE;
    expect(fieldDataClassOf(declared, field("name", "personal"))).toEqual({
      key: "personal",
      effects: DATA_CLASSIFICATION_EFFECTS.personal,
    });
    expect(fieldDataClassOf(declared, field("note"))).toEqual({ key: "clinical_note", effects });
    expect(fieldDataClassOf(declared, field("note", "credential"))).toEqual({
      key: "clinical_note",
      effects: { ...effects, export: "excluded" },
    });
    expect(fieldDataClassOf(declared, field("room"))).toBeUndefined();
  });

  it("counts an unreadable @Classify class only through its @Classified code", () => {
    const declared = model("Visit", [], [classify("note", { key: "note", ai: "never" })]);
    expect(fieldDataClassOf(declared, field("note"))).toBeUndefined();
    expect(fieldDataClassOf(declared, field("note", "health"))?.key).toBe("health");
  });
});

describe(checkDataClasses, () => {
  it("passes classified fields whose model meets their classes", () => {
    const visit = model("Visit", [RETENTION], [classify("note", CLINICAL_NOTE)]);
    expect(
      refused(
        [visit],
        [shapeOf(visit, [field("note", "health"), field("name", "personal"), field("room")])],
      ),
    ).toEqual([]);
  });

  it("refuses a @Classify class that leaves an effect out", () => {
    const { mask: _mask, ...partial } = CLINICAL_NOTE;
    const visit = model("Visit", [RETENTION], [classify("note", partial)]);
    expect(refused([visit], [shapeOf(visit, [field("note")])])).toEqual([
      "data_class_effects_missing Visit.note",
    ]);
  });

  it("refuses a @Classify class looser than the field's @Classified class, naming each effect", () => {
    const loose = { ...CLINICAL_NOTE, key: "loose_note", encrypt: "clear", support: "visible" };
    const visit = model("Visit", [RETENTION], [classify("note", loose)]);
    const errors = checkDataClasses(irOf([visit], [shapeOf(visit, [field("note", "health")])]));
    expect(errors.map((error) => `${error.code} ${error.subject}`)).toEqual([
      "data_class_looser_than_classified Visit.note",
    ]);
    expect(errors[0]?.message).toContain(
      "support (visible below hidden), encrypt (clear below sealed)",
    );
  });

  it("refuses a model holding a retention-bound field without Retention, once per model", () => {
    const patient = model("Patient");
    expect(
      refused(
        [patient],
        [shapeOf(patient, [field("diagnosis", "health"), field("allergies", "health")])],
      ),
    ).toEqual(["classified_model_without_retention Patient"]);
  });

  it("refuses in the full generateMember pass", () => {
    const patient = model("Patient", [{ name: "HasEncryptedFields", args: ["diagnosis"] }]);
    const result = generateMember(
      irOf([patient], [shapeOf(patient, [field("diagnosis", "health")])]),
    );
    expect(result.errors.map((error) => error.code)).toContain(
      "classified_model_without_retention",
    );
  });
});
