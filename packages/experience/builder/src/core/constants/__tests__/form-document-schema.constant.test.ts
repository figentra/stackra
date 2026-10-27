/**
 * Stackra file contract:
 * Purpose: unit tests of `FORM_DOCUMENT_SCHEMA` (`FormDocument$`), the form document kind (tenancy G4, stackra-139):
 *          a minimal form parses with its defaults (version 1, `forms.submit@1`, `required: false`); the shape refuses
 *          a bad form key, a prose label, a choice without options, options on a non-choice, `min` above `max`, two
 *          steps or two fields with one key, and an empty or oversized step list.
 * Boundary: test only; pure. Condition checks against the form's own fields are `formProblems`' tests.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0426 (decisions 1 and 2); ADR 0279 (decision 2: onboarding is a form document).
 */
import { describe, expect, it } from "@stackra/testing";

import { FORM_DOCUMENT_SCHEMA } from "#core/constants/form-document-schema.constant";

/** The one field of `MINIMAL`. */
const FIELD = { key: "name", type: "text", label: "tenancy::onboarding.name" };

/** The one step of `MINIMAL`. */
const STEP = { key: "about", label: "tenancy::onboarding.about", fields: [FIELD] };

/** A one-step, one-field form. */
const MINIMAL = { key: "tenancy.onboarding", label: "tenancy::onboarding.title", steps: [STEP] };

/** `MINIMAL` with its one field replaced by `field`. */
const withField = (field: Record<string, unknown>) => ({
  ...MINIMAL,
  steps: [{ ...STEP, fields: [{ ...FIELD, ...field }] }],
});

describe("FORM_DOCUMENT_SCHEMA", () => {
  it("parses a minimal form with its defaults", () => {
    const form = FORM_DOCUMENT_SCHEMA.parse(MINIMAL);
    expect(form.version).toBe(1);
    expect(form.submit).toBe("forms.submit@1");
    expect(form.steps[0]?.fields[0]?.required).toBe(false);
  });

  it("refuses a form key that is not <module>.<name> and a label that is prose", () => {
    expect(FORM_DOCUMENT_SCHEMA.safeParse({ ...MINIMAL, key: "onboarding" }).success).toBe(false);
    expect(FORM_DOCUMENT_SCHEMA.safeParse({ ...MINIMAL, label: "Welcome!" }).success).toBe(false);
  });

  it("requires options on a choice field and only there", () => {
    expect(FORM_DOCUMENT_SCHEMA.safeParse(withField({ type: "choice" })).success).toBe(false);
    expect(
      FORM_DOCUMENT_SCHEMA.safeParse(withField({ options: { a: "tenancy::onboarding.a" } }))
        .success,
    ).toBe(false);
    expect(
      FORM_DOCUMENT_SCHEMA.safeParse(
        withField({ type: "multi_choice", options: { a: "tenancy::onboarding.a" } }),
      ).success,
    ).toBe(true);
  });

  it("refuses min above max and an unknown field type", () => {
    expect(
      FORM_DOCUMENT_SCHEMA.safeParse(withField({ type: "number", min: 5, max: 1 })).success,
    ).toBe(false);
    expect(FORM_DOCUMENT_SCHEMA.safeParse(withField({ type: "script" })).success).toBe(false);
  });

  it("refuses two steps or two fields with one key", () => {
    expect(FORM_DOCUMENT_SCHEMA.safeParse({ ...MINIMAL, steps: [STEP, STEP] }).success).toBe(false);
    expect(
      FORM_DOCUMENT_SCHEMA.safeParse({
        ...MINIMAL,
        steps: [STEP, { ...STEP, key: "again" }],
      }).success,
    ).toBe(false);
  });

  it("takes 1 to 20 steps", () => {
    expect(FORM_DOCUMENT_SCHEMA.safeParse({ ...MINIMAL, steps: [] }).success).toBe(false);
    const steps = Array.from({ length: 21 }, (_, index) => ({
      key: `step${index}`,
      label: "tenancy::onboarding.about",
      fields: [{ key: `field${index}`, type: "text", label: "tenancy::onboarding.name" }],
    }));
    expect(FORM_DOCUMENT_SCHEMA.safeParse({ ...MINIMAL, steps }).success).toBe(false);
    expect(FORM_DOCUMENT_SCHEMA.safeParse({ ...MINIMAL, steps: steps.slice(0, 20) }).success).toBe(
      true,
    );
  });
});
