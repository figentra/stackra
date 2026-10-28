/**
 * Stackra file contract:
 * Purpose: `formRules`, the `@stackra/rules` registry a form's conditions are checked and evaluated against: one fact
 *          source, `answers`, whose fields are the form's testable fields (every type but money) up to and including
 *          the given step.
 * Boundary: pure; internal to the package. A text, email or phone field is a string fact, a number a number, a date a
 *           date, a yes-or-no an enum of `true` and `false`, a choice an enum of its options and a multiple choice a
 *           list. A money field is not testable: the rules engine compares only `Money` values, which a form answer
 *           is not. `undefined` when no field up to the step is testable, so any condition there is refused.
 * Runtime: isomorphic
 * Governing contract: ADR 0426 (decision 2: conditions are rule-engine nodes); ADR 0331 (decisions 1 and 4).
 */
import { Rules } from "@stackra/rules";
import { type FactField, FieldType } from "@stackra/rules/contracts";

import { FormFieldType } from "#contracts/index";
import type { FormDocument } from "#core/types/form-document.type";
import type { FormDocumentField } from "#core/types/form-document-field.type";

/** The fact a field becomes, or `undefined` for a field no condition may test. */
function factOf(field: FormDocumentField): FactField | undefined {
  const label = field.label as FactField["label"];
  switch (field.type) {
    case FormFieldType.Number:
      return { type: FieldType.Number, label };
    case FormFieldType.Date:
      return { type: FieldType.Date, label };
    case FormFieldType.Boolean:
      return { type: FieldType.Enum, label, values: { true: label, false: label } };
    case FormFieldType.Choice:
      return {
        type: FieldType.Enum,
        label,
        values: (field.options ?? {}) as Record<string, FactField["label"]>,
      };
    case FormFieldType.MultiChoice:
      return { type: FieldType.List, label };
    case FormFieldType.Money:
      return undefined;
    default:
      return { type: FieldType.String, label };
  }
}

/**
 * The registry of `form`'s testable fields in steps `0` to `through` (none for a negative `through`).
 *
 * @example
 * formRules(onboarding, 1)?.check({ field: "answers.kind", operator: "equals", value: "organisation" });
 */
export function formRules(form: FormDocument, through: number): Rules | undefined {
  const fields: Record<string, FactField> = {};
  for (const step of form.steps.slice(0, through + 1))
    for (const field of step.fields) {
      const fact = factOf(field);
      if (fact !== undefined) fields[field.key] = fact;
    }
  if (Object.keys(fields).length === 0) return undefined;
  return Rules.create({ key: form.key, sources: [{ key: "answers", fields }] });
}
