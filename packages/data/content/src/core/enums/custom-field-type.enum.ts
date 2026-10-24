/**
 * Stackra file contract:
 * Purpose: `CustomFieldType`, the registered field types a custom field may take, with each type's case data: what its
 *          `min` and `max` bound (`bounds`), whether it takes `choices`, and the most characters it stores
 *          (`maxLength`).
 * Boundary: an `Enum.of` value plus the type of the same name; the code is the stored `type` of a definition, and the
 *           case data drives `checkCustomFieldDefinition` and `checkCustomFields`. A type is registered code: a new one
 *           is a change to this enum and to `checkCustomFields`, never stored data (ADR 0154).
 * Runtime: isomorphic
 * Governing contract: ADR 0116 (decision CT2); ADR 0226 (decision 1: registered field types); ADR 0154; ADR 0294
 *                     (decision 16).
 */
import { Enum } from "@stackra/contracts";

/**
 * The registered field types. `bounds` is `length` (characters), `value` (the number itself), `picks` (how many
 * choices) or `null` (no bounds).
 *
 * @example
 * Enum.meta(CustomFieldType, CustomFieldType.Text).maxLength; // 255
 */
export const CustomFieldType = Enum.of({
  /** One line of text. */
  Text: ["text", { bounds: "length", choices: false, maxLength: 255 }],
  /** Several lines of text. */
  LongText: ["long_text", { bounds: "length", choices: false, maxLength: 10_000 }],
  /** A finite number. */
  Number: ["number", { bounds: "value", choices: false, maxLength: null }],
  /** Yes or no. */
  Boolean: ["boolean", { bounds: null, choices: false, maxLength: null }],
  /** A calendar date, `YYYY-MM-DD`. */
  Date: ["date", { bounds: null, choices: false, maxLength: null }],
  /** One of the definition's choices. */
  Select: ["select", { bounds: null, choices: true, maxLength: null }],
  /** Several distinct choices. */
  MultiSelect: ["multi_select", { bounds: "picks", choices: true, maxLength: null }],
  /** An `http` or `https` URL. */
  Url: ["url", { bounds: null, choices: false, maxLength: 2048 }],
  /** An email address. */
  Email: ["email", { bounds: null, choices: false, maxLength: 254 }],
});

/** One of the codes above. */
export type CustomFieldType = Enum.Value<typeof CustomFieldType>;
