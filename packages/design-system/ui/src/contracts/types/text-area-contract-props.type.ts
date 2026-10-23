/**
 * Stackra file contract:
 * Purpose: the props every runtime's `TextArea` takes: the `TextField` contract without a kind of text, plus the
 *          number of lines shown. Each runtime's `TextAreaProps` is this plus its HeroUI field's own props, which pass
 *          through unchanged.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7, props vocabulary);
 *          ADR 0055 (forms: one field contract).
 */
import type { TextFieldContractProps } from "#contracts/types/text-field-contract-props.type";

/** Props shared by the web and native `TextArea`. */
export interface TextAreaContractProps extends Omit<TextFieldContractProps, "type"> {
  /** The number of text lines the area shows before it scrolls; native shows it on Android only. */
  readonly rows?: number | undefined;
}
