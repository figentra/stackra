/**
 * Stackra file contract:
 * Purpose: `FormFieldSpec`, the server-driven shape of one form field: the input path, its words (label, help,
 *          placeholder), the overrides of the schema's required, disabled and read-only, the control to draw, the
 *          number bounds and format, the grid span, the form predicate that hides it and the choices of a select.
 * Boundary: a type only; data. A recorded value field (`FieldNode`) carries every field but `name` (its `key`) and
 *           `options` (its `choices`, since `options` there is the query a picker reads). Text fields are words or
 *           i18n keys, which the renderer translates. `visibleWhen` names a boolean path of the form's own values.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 11: forms); ADR 0055 (one field contract); ADR 0504; the SDUI catalogue case
 *                     `formFields` (STA-1981).
 */
import type { FieldControl } from "#core/enums/field-control.enum";

/** One form field, as data. */
export interface FormFieldSpec {
  /** The input path the field binds. */
  readonly name: string;
  /** The label; absent, the derived i18n key. */
  readonly label?: string | undefined;
  /** Help text under the field. */
  readonly description?: string | undefined;
  /** Hint text inside the empty field. */
  readonly placeholder?: string | undefined;
  /** Overrides the schema's required. */
  readonly isRequired?: boolean | undefined;
  /** Disables the field. */
  readonly isDisabled?: boolean | undefined;
  /** Shows the value but refuses changes. */
  readonly isReadOnly?: boolean | undefined;
  /** The control to draw instead of the inferred one. */
  readonly control?: FieldControl | undefined;
  /** The smallest value of a number. */
  readonly minValue?: number | undefined;
  /** The largest value of a number. */
  readonly maxValue?: number | undefined;
  /** How far one step moves a number. Defaults to 1. */
  readonly step?: number | undefined;
  /** How a number is written and read, as `Intl.NumberFormat` takes it. */
  readonly formatOptions?: Intl.NumberFormatOptions | undefined;
  /** The grid columns the field spans. */
  readonly span?: 1 | 2 | 3 | 4 | undefined;
  /** The form path of a boolean; the field hides while it is not true. */
  readonly visibleWhen?: string | undefined;
  /** The choices of a select-like control, with their words. */
  readonly options?:
    | readonly {
        /** The value submitted. */
        readonly value: string;
        /** Its words. */
        readonly label: string;
      }[]
    | undefined;
}
