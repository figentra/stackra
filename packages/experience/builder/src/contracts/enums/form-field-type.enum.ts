/**
 * Stackra file contract:
 * Purpose: `FormFieldType`, the field types a form document may hold: short and long text, email, phone, number,
 *          money, date, yes-or-no, one choice and several choices. Each type fixes its answer's JSON form and its
 *          check (`formAnswersSchema`).
 * Boundary: an `Enum.of` value plus the type of the same name; the registry of field types is code (a new type needs
 *           a check and a renderer), the forms that use them are documents.
 * Runtime: isomorphic
 * Governing contract: ADR 0426 (decision 1); ADR 0115 (F1: a form is a UI document whose schema becomes Zod); ADR
 *                     0270 (decisions 6 and 13).
 */
import { Enum } from "@stackra/contracts";

/** The field types of a form. */
export const FormFieldType = Enum.of({
  /** One line of text, up to 500 characters (or `max`). */
  Text: "text",
  /** Several lines of text, up to 5,000 characters (or `max`). */
  LongText: "long_text",
  /** An email address. */
  Email: "email",
  /** A phone number in E.164 form (`+971501234567`). */
  Phone: "phone",
  /** A finite number, within `min` and `max` when set. */
  Number: "number",
  /** An amount in minor units with its currency (`{ minor, currency }`). */
  Money: "money",
  /** A calendar date (`2026-10-26`). */
  Date: "date",
  /** Yes or no. */
  Boolean: "boolean",
  /** One code of the field's options. */
  Choice: "choice",
  /** Any codes of the field's options. */
  MultiChoice: "multi_choice",
});

/** One of the codes above. */
export type FormFieldType = Enum.Value<typeof FormFieldType>;
