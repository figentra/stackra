/**
 * Stackra file contract:
 * Purpose: The structural descriptor `Field.Setting` draws: a setting key's path, label, kind and bounds or options.
 * Boundary: types only. Split from field.tsx so that file exports only the `Field` table and each part hot-reloads
 *           (rule-gap B-6, react/only-export-components).
 * Runtime: browser
 * Governing contract: ADR 0055 (decision 2: thin field adapters); ADR 0305 (rules 10 to 13: one declaration per
 *                     file); ADR 0311 (fields props vocabulary).
 */
import type { SelectOption } from "#react/field/select-option.type";

/** The structural descriptor `Field.Setting` draws: a setting key's path, label, kind and bounds or options. */
export interface SettingDescriptor {
  /** The setting's path, which is the form field it binds to. */
  readonly path: string;
  /** The text the field is labelled with. */
  readonly label: string;
  /** How the setting is drawn: a switch, a number field, a select (needs `options`) or a text field. */
  readonly kind: "boolean" | "number" | "select" | "text";
  /** The lower bound of a number. */
  readonly min?: number;
  /** The upper bound of a number. */
  readonly max?: number;
  /** The choices of a select. */
  readonly options?: readonly SelectOption[];
}
