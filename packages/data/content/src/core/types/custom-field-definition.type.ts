/**
 * Stackra file contract:
 * Purpose: `CustomFieldDefinition`, the stored schema of one custom field: its key on a record, its registered type,
 *          its label per locale, whether a record must carry it, and the bounds and choices its type takes.
 * Boundary: a type only; data, never code (ADR 0154): no expression, function or template anywhere, and
 *           `checkCustomFieldDefinition` refuses any key not listed here. `choices` belongs to `select` and
 *           `multi_select` only; `min` and `max` to `text` and `long_text` (lengths), `number` (values) and
 *           `multi_select` (how many picks). The definition is the wire form the host's actions take and return.
 * Runtime: isomorphic
 * Governing contract: ADR 0116 (decision CT2); ADR 0226 (decision 1); ADR 0154; ADR 0231 (camelCase JSON keys).
 */
import type { CustomFieldType } from "#core/enums/custom-field-type.enum";
import type { CustomFieldChoice } from "#core/types/custom-field-choice.type";

/**
 * One custom field.
 *
 * @example
 * const shoeSize: CustomFieldDefinition = {
 *   key: "shoeSize",
 *   type: CustomFieldType.Select,
 *   label: { en: "Shoe size", ar: "مقاس الحذاء" },
 *   required: false,
 *   choices: [
 *     { value: "42", label: { en: "42" } },
 *     { value: "43", label: { en: "43" } },
 *   ],
 * };
 */
export interface CustomFieldDefinition {
  /** The value's key on a record: camelCase, 1 to 63 characters, unique per model in its scope. */
  readonly key: string;

  /** The registered type, which fixes the value's shape. */
  readonly type: CustomFieldType;

  /** The field's label per locale tag; at least one, each 1 to 120 characters. */
  readonly label: Readonly<Record<string, string>>;

  /** Whether every record must carry a value. */
  readonly required: boolean;

  /** The options of a `select` or `multi_select`: 1 to 100, distinct values. */
  readonly choices?: readonly CustomFieldChoice[];

  /** The shortest length (`text`, `long_text`), the lowest value (`number`) or the fewest picks (`multi_select`). */
  readonly min?: number;

  /** The longest length (`text`, `long_text`), the highest value (`number`) or the most picks (`multi_select`). */
  readonly max?: number;
}
