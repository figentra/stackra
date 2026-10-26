/**
 * Stackra file contract:
 * Purpose: `FORM_DOCUMENT_SCHEMA`, the zod schema of `FormDocument` (its `X$`), the form document kind: a key
 *          (`<module>.<name>`, `tenancy.onboarding`), a version, a lang-key label, the action key it submits to
 *          (`forms.submit@1` by default), and 1 to 20 steps, each with a camelCase key, a label, an optional
 *          `@stackra/rules` condition that shows it, and 1 to 50 fields. A field has a camelCase key unique in the
 *          form, a `FormFieldType`, a label, optional help, `required` (false by default), options for a choice (code
 *          to lang key), `min` and `max` for a number or a text length, and an optional condition of its own.
 * Boundary: shape only: a condition is checked against the form's own fields by `checkForm`: a step's condition
 *           names `answers.<field>` of an earlier step, a field's of an earlier step or its own. Text is lang keys, never prose; a form
 *           holds no code, markup or expression (ADR 0154). Multi-step, conditional steps, save and resume are this
 *           document's; the submission record is the submitting action's.
 * Runtime: isomorphic
 * Governing contract: ADR 0426 (decisions 1 and 2); ADR 0115 (F1 and F2); ADR 0270 (decisions 6 and 13); ADR 0279
 *                     (decision 2: onboarding is a form document); ADR 0294 (decision 26).
 */
import { Enum } from "@stackra/contracts";
import { Condition$ } from "@stackra/rules";
import { z } from "zod";

import { FormFieldType } from "#contracts/index";

/** A lang key (`<module>::<path>`). */
const LABEL = z
  .string()
  .regex(/^[a-z][a-z0-9_-]*::[a-z0-9_.-]+$/, "Expected a lang key such as module::path");

/** A camelCase key of 1 to 63 characters. */
const KEY = z.string().regex(/^[a-z][a-zA-Z0-9]{0,62}$/, "Expected a camelCase key");

/** One field. */
const FIELD = z
  .object({
    key: KEY,
    type: z.enum(Enum.values(FormFieldType) as [FormFieldType, ...FormFieldType[]]),
    label: LABEL,
    help: LABEL.optional(),
    required: z.boolean().default(false),
    options: z.record(z.string().regex(/^[a-z0-9][a-z0-9_]{0,62}$/), LABEL).optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    when: Condition$.optional(),
  })
  .refine(
    (field) =>
      (field.type === FormFieldType.Choice || field.type === FormFieldType.MultiChoice) ===
      (field.options !== undefined && Object.keys(field.options).length > 0),
    { message: "A choice field, and only a choice field, lists its options", path: ["options"] },
  )
  .refine((field) => field.min === undefined || field.max === undefined || field.min <= field.max, {
    message: "min is above max",
    path: ["min"],
  });

/** The shipped `FormDocument$`. */
export const FORM_DOCUMENT_SCHEMA = z
  .object({
    key: z.string().regex(/^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/, "Expected <module>.<name>"),
    version: z.int().min(1).default(1),
    label: LABEL,
    submit: z
      .string()
      .regex(
        /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+@\d+$/,
        "Expected an action key such as forms.submit@1",
      )
      .default("forms.submit@1"),
    steps: z
      .array(
        z.object({
          key: KEY,
          label: LABEL,
          when: Condition$.optional(),
          fields: z.array(FIELD).min(1).max(50),
        }),
      )
      .min(1)
      .max(20),
  })
  .refine((form) => new Set(form.steps.map((step) => step.key)).size === form.steps.length, {
    message: "Two steps share a key",
    path: ["steps"],
  })
  .refine(
    (form) => {
      const keys = form.steps.flatMap((step) => step.fields.map((field) => field.key));
      return new Set(keys).size === keys.length;
    },
    { message: "Two fields share a key", path: ["steps"] },
  );
