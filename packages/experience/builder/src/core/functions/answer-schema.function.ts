/**
 * Stackra file contract:
 * Purpose: `answerSchema`, the zod schema of one answer to a form field, by its type: trimmed text up to 500 (long text
 *          5,000) characters or the field's `max`, at least its `min`; an email; an E.164 phone; a number within `min`
 *          and `max`; a money amount `{ minor, currency }`; an ISO date; a yes-or-no; one option code; distinct option
 *          codes.
 * Boundary: pure; internal to the package. `required` is not checked here: `formAnswersSchema` decides whether a
 *           missing answer is a problem, since a hidden field never is.
 * Runtime: isomorphic
 * Governing contract: ADR 0426 (decision 1); ADR 0115 (F1: the form's schema becomes Zod everywhere).
 */
import { z } from "zod";

import { FormFieldType } from "#contracts/index";
import type { FormDocumentField } from "#core/types/form-document-field.type";

/**
 * The schema of an answer to `field`.
 *
 * @example
 * answerSchema({ key: "seats", type: FormFieldType.Number, label, required: true, min: 1 }).safeParse(0).success; // false
 */
export function answerSchema(field: FormDocumentField): z.ZodType {
  const options = Object.keys(field.options ?? {}) as [string, ...string[]];
  const text = (limit: number) =>
    z
      .string()
      .trim()
      .min(Math.max(1, field.min ?? 1))
      .max(field.max ?? limit);
  switch (field.type) {
    case FormFieldType.Text:
      return text(500);
    case FormFieldType.LongText:
      return text(5000);
    case FormFieldType.Email:
      return z.email();
    case FormFieldType.Phone:
      return z.string().regex(/^\+[1-9]\d{6,14}$/);
    case FormFieldType.Number:
      return z
        .number()
        .min(field.min ?? Number.NEGATIVE_INFINITY)
        .max(field.max ?? Number.POSITIVE_INFINITY);
    case FormFieldType.Money:
      return z.object({ minor: z.int(), currency: z.string().regex(/^[A-Z]{3}$/) }).strict();
    case FormFieldType.Date:
      return z.iso.date();
    case FormFieldType.Boolean:
      return z.boolean();
    case FormFieldType.Choice:
      return z.enum(options);
    default:
      return z
        .array(z.enum(options))
        .refine((codes) => new Set(codes).size === codes.length, "Expected distinct options");
  }
}
