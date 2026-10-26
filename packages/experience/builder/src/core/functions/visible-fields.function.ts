/**
 * Stackra file contract:
 * Purpose: `visibleFields`, the fields a respondent sees given their answers so far: those of each step whose
 *          condition matches, whose own condition matches too, in form order.
 * Boundary: pure. Conditions are evaluated with `@stackra/rules`' `evaluate` over the answers that pass their field's
 *           check (an invalid or missing answer is an unset fact), at `now` for relative date tests. The form must
 *           already be checked (`checkForm`), so every condition names a field the registry has.
 * Runtime: isomorphic
 * Governing contract: ADR 0426 (decision 2: conditional steps and fields); ADR 0270 (decision 13); ADR 0331 (decision
 *                     1: one evaluator).
 */
import type { Json } from "@stackra/contracts";
import { type Condition, evaluate, type FactValue } from "@stackra/rules";

import { FormFieldType } from "#contracts/index";
import { answerSchema } from "#core/functions/answer-schema.function";
import { formRules } from "#core/functions/form-rules.function";
import type { FormDocument } from "#core/types/form-document.type";
import type { FormField } from "#core/types/form-field.type";

/** The fact an answer gives, or `undefined` when it does not pass its field's check or is not testable. */
function factOf(field: FormField, answer: Json | undefined): FactValue | undefined {
  if (answer === undefined || !answerSchema(field).safeParse(answer).success) return undefined;
  switch (field.type) {
    case FormFieldType.Money:
      return undefined;
    case FormFieldType.Date:
      return new Date(`${String(answer)}T00:00:00Z`);
    case FormFieldType.Boolean:
      return String(answer);
    default:
      return answer as FactValue;
  }
}

/**
 * The fields of `form` shown for `answers` at `now`.
 *
 * @example
 * visibleFields(onboarding, { kind: "individual" }, new Date()).map((field) => field.key); // no "region"
 */
export function visibleFields(
  form: FormDocument,
  answers: Readonly<Record<string, Json>>,
  now: Date,
): FormField[] {
  const facts: Record<string, FactValue | undefined> = {};
  for (const step of form.steps)
    for (const field of step.fields) facts[field.key] = factOf(field, answers[field.key]);
  const matches = (condition: Condition | undefined, through: number): boolean => {
    if (condition === undefined) return true;
    const rules = formRules(form, through);
    return rules !== undefined && evaluate(rules, condition, { answers: facts }, { now }).matched;
  };
  return form.steps.flatMap((step, index) =>
    matches(step.when, index - 1) ? step.fields.filter((field) => matches(field.when, index)) : [],
  );
}
