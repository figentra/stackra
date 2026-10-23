/**
 * Stackra file contract:
 * Purpose: the props every runtime's `InputGroup` takes: the `TextField` contract plus a prefix and a suffix drawn
 *          inside the input's border, on its inline-start and inline-end sides (a slug's `/`, a unit, a currency, a
 *          reveal button). Each runtime's `InputGroupProps` is this plus its HeroUI field's own props, which pass
 *          through unchanged.
 * Boundary: types only. A string or number is plain text beside the value; any element is drawn as given and may be
 *           interactive.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7, props vocabulary);
 *          ADR 0055 (forms: one field contract).
 */
import type { ReactNode } from "react";

import type { TextFieldContractProps } from "#contracts/types/text-field-contract-props.type";

/** Props shared by the web and native `InputGroup`. */
export interface InputGroupContractProps extends TextFieldContractProps {
  /** Content before the value, on the inline-start side: short text, or an element such as an icon. */
  readonly prefix?: ReactNode;
  /** Content after the value, on the inline-end side: short text, or an element such as a button. */
  readonly suffix?: ReactNode;
}
