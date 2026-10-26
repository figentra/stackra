/**
 * Stackra file contract:
 * Purpose: unit tests of the form kind's checks: `formProblems` finds nothing in a valid form, reports a shape refusal
 *          at its path, a condition over a field of a later step or an unknown field, and a money field tested in a
 *          condition; `checkForm` returns the parsed form with its defaults or throws `FormInvalidError` with those
 *          field errors.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0426 (decisions 1 and 2).
 */
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { FormInvalidError } from "#core/errors/form-invalid.error";
import { checkForm } from "#core/functions/check-form.function";
import { formProblems } from "#core/functions/form-problems.function";

/** An onboarding form: who you are, then the organisation's region only for an organisation. */
const ONBOARDING = {
  key: "tenancy.onboarding",
  label: "tenancy::onboarding.title",
  steps: [
    {
      key: "about",
      label: "tenancy::onboarding.about",
      fields: [
        {
          key: "kind",
          type: "choice",
          label: "tenancy::onboarding.kind",
          required: true,
          options: {
            organisation: "tenancy::onboarding.organisation",
            individual: "tenancy::onboarding.individual",
          },
        },
        { key: "budget", type: "money", label: "tenancy::onboarding.budget" },
      ],
    },
    {
      key: "organisation",
      label: "tenancy::onboarding.organisation",
      when: { field: "answers.kind", operator: "equals", value: "organisation" },
      fields: [
        { key: "region", type: "text", label: "tenancy::onboarding.region", required: true },
      ],
    },
  ],
};

/** `ONBOARDING` with the second step's condition replaced by `when`. */
const withCondition = (when: unknown) => ({
  ...ONBOARDING,
  steps: [ONBOARDING.steps[0], { ...ONBOARDING.steps[1], when }],
});

describe("formProblems", () => {
  it("finds nothing in a valid form", () => {
    expect(formProblems(ONBOARDING)).toEqual({});
  });

  it("reports a shape refusal at its path", () => {
    expect(formProblems({ ...ONBOARDING, key: "Onboarding" })).toEqual({ key: "invalid" });
  });

  it("refuses a condition over an unknown or later field, and over money", () => {
    expect(formProblems(withCondition({ field: "answers.region", operator: "is_set" }))).toEqual({
      "steps.1.when": "field_unknown",
    });
    expect(formProblems(withCondition({ field: "answers.budget", operator: "is_set" }))).toEqual({
      "steps.1.when": "field_unknown",
    });
    expect(
      formProblems(
        withCondition({ all: [{ field: "answers.kind", operator: "equals", value: "robot" }] }),
      ),
    ).toEqual({ "steps.1.when.all.0": "value_invalid" });
  });
});

describe(checkForm, () => {
  it("returns the parsed form with its defaults", () => {
    const form = checkForm(ONBOARDING);
    expect(form).toMatchObject({ version: 1, submit: "forms.submit@1" });
    expect(form.steps[0]?.fields[1]?.required).toBe(false);
  });

  it("throws FormInvalidError with the field errors", () => {
    try {
      checkForm(withCondition({ field: "answers.nope", operator: "is_set" }));
      expect.unreachable();
    } catch (error) {
      expect(isRefusal(error, FormInvalidError)).toBe(true);
      expect((error as FormInvalidError).fieldErrors).toEqual({ "steps.1.when": "field_unknown" });
    }
  });
});
