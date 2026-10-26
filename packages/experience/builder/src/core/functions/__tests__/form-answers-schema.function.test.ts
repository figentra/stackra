/**
 * Stackra file contract:
 * Purpose: unit tests of `visibleFields` and `formAnswersSchema`: a step shows only when its condition matches the
 *          answers; a shown required field without an answer is `required` unless partial; an answer of the wrong form
 *          is `value_invalid`; answers to hidden or unknown fields are dropped; each field type checks its answer.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0426 (decisions 1 and 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { FormFieldType } from "#contracts/index";
import { answerSchema } from "#core/functions/answer-schema.function";
import { checkForm } from "#core/functions/check-form.function";
import { formAnswersSchema } from "#core/functions/form-answers-schema.function";
import { visibleFields } from "#core/functions/visible-fields.function";

const NOW = new Date("2026-10-26T09:00:00Z");

const label = "tenancy::onboarding.field";

const FORM = checkForm({
  key: "tenancy.onboarding",
  label,
  steps: [
    {
      key: "about",
      label,
      fields: [
        {
          key: "kind",
          type: "choice",
          label,
          required: true,
          options: { organisation: label, individual: label },
        },
        { key: "seats", type: "number", label, min: 1, max: 500 },
      ],
    },
    {
      key: "organisation",
      label,
      when: { field: "answers.kind", operator: "equals", value: "organisation" },
      fields: [{ key: "region", type: "text", label, required: true }],
    },
  ],
});

describe(visibleFields, () => {
  it("shows a conditional step only when its condition matches", () => {
    expect(visibleFields(FORM, { kind: "individual" }, NOW).map((field) => field.key)).toEqual([
      "kind",
      "seats",
    ]);
    expect(visibleFields(FORM, { kind: "organisation" }, NOW).map((field) => field.key)).toEqual([
      "kind",
      "seats",
      "region",
    ]);
  });
});

describe(formAnswersSchema, () => {
  it("requires shown required fields and drops hidden and unknown answers", () => {
    const schema = formAnswersSchema(FORM, NOW);
    expect(schema.parse({ kind: "individual", region: "eu", extra: 1 })).toEqual({
      kind: "individual",
    });
    expect(
      schema
        .safeParse({ kind: "organisation" })
        .error?.issues.map((issue) => [issue.path, issue.message]),
    ).toEqual([[["region"], "required"]]);
    expect(formAnswersSchema(FORM, NOW, { partial: true }).parse({ kind: "organisation" })).toEqual(
      {
        kind: "organisation",
      },
    );
  });

  it("refuses an answer of the wrong form without echoing it", () => {
    const issues = formAnswersSchema(FORM, NOW).safeParse({ kind: "individual", seats: 0 }).error
      ?.issues;
    expect(issues?.map((issue) => [issue.path, issue.message])).toEqual([
      [["seats"], "value_invalid"],
    ]);
  });
});

describe(answerSchema, () => {
  const field = (type: FormFieldType, more: object = {}) =>
    ({ key: "x", type, label, required: false, ...more }) as Parameters<typeof answerSchema>[0];

  it.each([
    [FormFieldType.Email, "a@b.co", "nope"],
    [FormFieldType.Phone, "+971501234567", "0501234567"],
    [FormFieldType.Money, { minor: 1000, currency: "AED" }, { minor: 1.5, currency: "AED" }],
    [FormFieldType.Date, "2026-10-26", "26/10/2026"],
    [FormFieldType.Boolean, true, "yes"],
    [FormFieldType.LongText, "long enough", ""],
  ])("checks a %s answer", (type, good, bad) => {
    expect(answerSchema(field(type)).safeParse(good).success).toBe(true);
    expect(answerSchema(field(type)).safeParse(bad).success).toBe(false);
  });

  it("checks multiple choices against the options, once each", () => {
    const multi = answerSchema(
      field(FormFieldType.MultiChoice, { options: { a: label, b: label } }),
    );
    expect(multi.safeParse(["a", "b"]).success).toBe(true);
    expect(multi.safeParse(["a", "a"]).success).toBe(false);
    expect(multi.safeParse(["c"]).success).toBe(false);
  });
});
