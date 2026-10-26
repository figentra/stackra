/**
 * Stackra file contract:
 * Purpose: `formAnswersSchema`, the zod schema of the answers to a checked form at an instant: each shown field's
 *          answer is checked by its type (`value_invalid`) and a shown required field must have one (`required`); an
 *          answer to a hidden or unknown field is dropped from the output. With `partial`, a missing required answer
 *          is allowed, so a respondent saves and resumes.
 * Boundary: pure. It is the submit action's input check and the renderer's per-step check alike, so the server and the
 *           client refuse the same answers. Issue messages are snake_case codes at the field key and never echo a
 *           value.
 * Runtime: isomorphic
 * Governing contract: ADR 0426 (decisions 1 and 2); ADR 0115 (F1: the form's schema becomes Zod everywhere); ADR 0270
 *                     (decision 13: save and resume).
 */
import type { Json } from "@stackra/contracts";
import { z } from "zod";

import { answerSchema } from "#core/functions/answer-schema.function";
import { visibleFields } from "#core/functions/visible-fields.function";
import type { FormDocument } from "#core/types/form-document.type";

/**
 * The answers schema of `form` at `now`.
 *
 * @example
 * const answers = formAnswersSchema(onboarding, ctx.now()).parse(input.answers);
 */
export function formAnswersSchema(
  form: FormDocument,
  now: Date,
  options: { readonly partial?: boolean } = {},
): z.ZodType<Record<string, Json>> {
  const schema = z
    .record(z.string(), z.json())
    .superRefine((input, ctx) => {
      const answers = input as Record<string, Json>;
      for (const field of visibleFields(form, answers, now)) {
        const answer = answers[field.key];
        if (answer === undefined || answer === null) {
          if (field.required && options.partial !== true)
            ctx.addIssue({ code: "custom", message: "required", path: [field.key] });
          continue;
        }
        if (!answerSchema(field).safeParse(answer).success)
          ctx.addIssue({ code: "custom", message: "value_invalid", path: [field.key] });
      }
    })
    .transform((input) => {
      const answers = input as Record<string, Json>;
      return Object.fromEntries(
        visibleFields(form, answers, now)
          .filter((field) => answers[field.key] !== undefined && answers[field.key] !== null)
          .map((field) => [field.key, answers[field.key] as Json]),
      );
    });
  // reason: zod's JSON type and @stackra/contracts' `Json` describe the same values under two names
  return schema as unknown as z.ZodType<Record<string, Json>>;
}
