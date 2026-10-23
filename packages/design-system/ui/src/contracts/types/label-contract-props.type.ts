/**
 * Stackra file contract:
 * Purpose: the props every runtime's `Label` takes: the text that names a field, and the required, invalid and
 *          disabled states it shows. Each runtime's `LabelProps` is this plus its HeroUI label's own props, which pass
 *          through unchanged.
 * Boundary: types only. Inside a HeroUI field the three states come from the field, so a label there passes none; a
 *          label beside a plain control passes them itself.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0055 (forms); ADR 0165.
 */
import type { ReactNode } from "react";

/** Props shared by the web and native `Label`. */
export interface LabelContractProps {
  /** The label's text, required: a label with none names nothing. It names the field for assistive technology. */
  readonly children: ReactNode;
  /** True to mark the field as required: the label shows an asterisk. */
  readonly isRequired?: boolean | undefined;
  /** True to draw the label in the error colour. */
  readonly isInvalid?: boolean | undefined;
  /** True to draw the label in the disabled style. */
  readonly isDisabled?: boolean | undefined;
}
