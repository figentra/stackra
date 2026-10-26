/**
 * Stackra file contract:
 * Purpose: `MultipleComboBoxContractProps`: a ComboBox that picks several choices.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3: one API on web and
 *          native); ADR 0303 (decision 7, props vocabulary); ADR 0055 (forms: one field contract); ADR 0165 (UI
 *          contract).
 */
import type { FieldContractProps } from "#contracts/types/field-contract-props.type";
import type { ComboBoxBaseContractProps } from "#contracts/types/combo-box-base-contract-props.type";

/** A ComboBox that picks several choices: `value` is the list of their keys. */
export interface MultipleComboBoxContractProps
  extends ComboBoxBaseContractProps, FieldContractProps<readonly string[]> {
  /** Several choices at once; the web shows the picked ones as removable tags. */
  readonly selectionMode: "multiple";
}
