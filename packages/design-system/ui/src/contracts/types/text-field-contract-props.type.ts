/**
 * Stackra file contract:
 * Purpose: the props every runtime's `TextField` takes: the shared field contract for a string value, plus the
 *          placeholder, the variant, the kind of text and whether the field fills its parent's width. Each runtime's
 *          `TextFieldProps` is this plus its HeroUI field's own props, which pass through unchanged.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7, props vocabulary);
 *          ADR 0055 (forms: one field contract).
 */
import type { TextFieldType } from "#contracts/enums/text-field-type.enum";
import type { TextFieldVariant } from "#contracts/enums/text-field-variant.enum";
import type { FieldContractProps } from "#contracts/types/field-contract-props.type";

/** Props shared by the web and native `TextField`. */
export interface TextFieldContractProps extends FieldContractProps<string> {
  /** Hint text drawn inside the empty input. It never replaces the label: it is gone once the user types. */
  readonly placeholder?: string | undefined;
  /** The look of the field: `primary` on the page, `secondary` on a tinted surface. Defaults to `primary`. */
  readonly variant?: TextFieldVariant | undefined;
  /** The kind of text, which sets the keyboard and the masking. Defaults to `text`. */
  readonly type?: TextFieldType | undefined;
  /** True to fill the parent's width, false to size to the content. Defaults to true. */
  readonly isFullWidth?: boolean | undefined;
}
