/**
 * Stackra file contract:
 * Purpose: the props every runtime's `NumberField` takes: the field contract over a number (`null` for an empty field),
 *          plus the placeholder, the surface, full width, the bounds, the step, the number format, and whether the
 *          increment and decrement buttons show with their spoken names. Each runtime's `NumberFieldProps` is this plus
 *          the props of its renderer's number field, which pass through unchanged. FilterBar's number filter reuses the
 *          bounds, step and format by name.
 * Boundary: types only. The field formats and parses with `Intl.NumberFormat`, so percent, currency and unit come from
 *           `formatOptions` and the locale of the provider; the field never rounds the value the app holds beyond
 *           what the format shows. Money with a per-currency step is a later wrapper, not a prop here.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7, props vocabulary);
 *          ADR 0055 (forms: one field contract); ADR 0318.
 */
import type { TextFieldVariant } from "#contracts/enums/text-field-variant.enum";
import type { FieldContractProps } from "#contracts/types/field-contract-props.type";

/** Props shared by the web and native `NumberField`. */
export interface NumberFieldContractProps extends FieldContractProps<number | null> {
  /** Hint text drawn inside the empty input. It never replaces the label: it is gone once the user types. */
  readonly placeholder?: string | undefined;
  /** The look of the field: `primary` on the page, `secondary` on a tinted surface. Defaults to `primary`. */
  readonly variant?: TextFieldVariant | undefined;
  /** True to fill the parent's width, false to size to the content. Defaults to true. */
  readonly isFullWidth?: boolean | undefined;
  /** The smallest value; the field clamps a typed or stepped value to it, and the decrement button stops there. */
  readonly minValue?: number | undefined;
  /** The largest value; the field clamps a typed or stepped value to it, and the increment button stops there. */
  readonly maxValue?: number | undefined;
  /** How far one press of a stepper button, or an arrow key, moves the value. Defaults to 1. */
  readonly step?: number | undefined;
  /** How the number is written and read: percent, currency, unit, fraction digits and grouping, as `Intl` takes them. */
  readonly formatOptions?: Intl.NumberFormatOptions | undefined;
  /** False to hide the increment and decrement buttons and keep the arrow keys. Defaults to true. */
  readonly hasSteppers?: boolean | undefined;
  /** The spoken name of the increment button, for example "Add one seat". Defaults to the `ui` catalogue's word in the active locale. */
  readonly incrementLabel?: string | undefined;
  /** The spoken name of the decrement button, for example "Remove one seat". Defaults to the `ui` catalogue's word in the active locale. */
  readonly decrementLabel?: string | undefined;
}
