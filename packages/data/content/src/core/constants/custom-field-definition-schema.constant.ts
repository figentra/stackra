/**
 * Stackra file contract:
 * Purpose: `CUSTOM_FIELD_DEFINITION_SCHEMA`, the strict zod schema of a `CustomFieldDefinition`: the listed keys only,
 *          a registered type, a label per locale with no template expression, and the choices and bounds the type's
 *          case data allows.
 * Boundary: internal; `checkCustomFieldDefinition` is its one reader. A refinement's message is its snake_case field
 *           error code. The refinement runs only once every field parsed, so `Enum.meta` always gets a known type.
 * Runtime: isomorphic
 * Governing contract: ADR 0116 (decision CT2); ADR 0226 (decision 1 and its enforcement: no function or template
 *                     expression in a type); ADR 0154; ADR 0162 (per-locale text).
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { CustomFieldType } from "#core/enums/custom-field-type.enum";

/** A locale tag: a language, then optional subtags (`en`, `ar-SA`). */
const LOCALE = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/;

/** The openers of the template syntaxes a renderer could evaluate. */
const TEMPLATE = /\{\{|\$\{|<%/;

/** A camelCase key of 1 to 63 characters. */
const KEY = /^[a-z][a-zA-Z0-9]{0,62}$/;

/** A label per locale tag: at least one, each 1 to 120 characters with no template expression. */
const LABEL = z
  .record(
    z.string().regex(LOCALE),
    z
      .string()
      .min(1)
      .max(120)
      .refine((text) => !TEMPLATE.test(text), "template_expression"),
  )
  .refine((label) => Object.keys(label).length > 0, "label_required");

/** One choice of a select. */
const CHOICE = z.strictObject({ value: z.string().min(1).max(100), label: LABEL });

/** The definition schema. */
export const CUSTOM_FIELD_DEFINITION_SCHEMA = z
  .strictObject({
    key: z.string().regex(KEY),
    type: z.enum(Enum.values(CustomFieldType)),
    label: LABEL,
    required: z.boolean(),
    choices: z.array(CHOICE).min(1).max(100).exactOptional(),
    min: z.number().exactOptional(),
    max: z.number().exactOptional(),
  })
  .superRefine(({ type, choices, min, max }, ctx) => {
    const meta = Enum.meta(CustomFieldType, type);
    const refuse = (path: string, message: string): void => {
      ctx.addIssue({ code: "custom", path: [path], message });
    };
    if (meta.choices && choices === undefined) refuse("choices", "choices_required");
    if (!meta.choices && choices !== undefined) refuse("choices", "choices_not_allowed");
    if (choices !== undefined && new Set(choices.map(({ value }) => value)).size !== choices.length)
      refuse("choices", "choices_repeated");
    for (const [path, bound] of [
      ["min", min],
      ["max", max],
    ] as const) {
      if (bound === undefined) continue;
      if (meta.bounds === null) refuse(path, "bound_not_allowed");
      else if (meta.bounds !== "value" && !(Number.isInteger(bound) && bound >= 0))
        refuse(path, "bound_invalid");
    }
    const cap = meta.bounds === "picks" ? choices?.length : meta.maxLength;
    if (max !== undefined && typeof cap === "number" && max > cap) refuse("max", "too_big");
    if (min !== undefined && max !== undefined && min > max) refuse("min", "range_invalid");
  });
