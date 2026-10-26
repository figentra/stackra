/**
 * Stackra file contract:
 * Purpose: `formProblems`, every problem of a form document by path: what `FormDocument$` refuses (`invalid` at the
 *          zod issue's path), and each condition that names a field the form does not have before or in its own step,
 *          or an operator or value its type does not take (the rules engine's code under `<step or field>.when.`).
 * Boundary: pure; it never throws, so the form editor shows problems while a form is incomplete, and `checkForm`
 *           refuses what it reports. A step's condition is checked against the fields of earlier steps, a field's
 *           against those of its own and earlier steps, so nothing depends on an answer given after it.
 * Runtime: isomorphic
 * Governing contract: ADR 0426 (decisions 1 to 3); ADR 0331 (decision 3: unknown fields are refused at write time);
 *                     ADR 0140 (field errors by path).
 */
import type { FieldErrors } from "@stackra/errors";

import { FORM_DOCUMENT_SCHEMA } from "#core/constants/form-document-schema.constant";
import { formRules } from "#core/functions/form-rules.function";

/**
 * The problems of `input` as a form document; `{}` when it has none.
 *
 * @example
 * formProblems(draft); // { "steps.1.when.all.0": "field_unknown" }
 */
export function formProblems(input: unknown): FieldErrors {
  const parsed = FORM_DOCUMENT_SCHEMA.safeParse(input);
  const errors: Record<string, string> = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".");
      errors[path === "" ? "(root)" : path] ??= "invalid";
    }
    return errors;
  }
  const form = parsed.data;
  form.steps.forEach((step, index) => {
    const check = (condition: unknown, at: string, through: number): void => {
      if (condition === undefined) return;
      const rules = formRules(form, through);
      if (rules === undefined) {
        errors[`${at}.when`] = "field_unknown";
        return;
      }
      for (const [path, code] of Object.entries(rules.problems(condition)))
        errors[path === "(root)" ? `${at}.when` : `${at}.when.${path}`] = code;
    };
    check(step.when, `steps.${index}`, index - 1);
    step.fields.forEach((field, at) => check(field.when, `steps.${index}.fields.${at}`, index));
  });
  return errors;
}
