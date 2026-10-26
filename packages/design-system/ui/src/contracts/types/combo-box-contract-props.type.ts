/**
 * Stackra file contract:
 * Purpose: the props every runtime's `ComboBox` takes: the field contract over the chosen key, or a list of keys in
 *          multiple mode, plus the choices, the placeholder, full width, the typed text with its change handler, the
 *          loading state, the load-more request and the message for no match. Each runtime's `ComboBoxProps` is this plus
 *          its renderer's own props, which pass through unchanged.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7, props vocabulary);
 *          ADR 0055 (forms: one field contract); ADR 0165 (UI contract).
 */

import type { SingleComboBoxContractProps } from "#contracts/types/single-combo-box-contract-props.type";
import type { MultipleComboBoxContractProps } from "#contracts/types/multiple-combo-box-contract-props.type";

/** Props shared by the web and native `ComboBox`: the single or the multiple form, told apart by `selectionMode`. */
export type ComboBoxContractProps = SingleComboBoxContractProps | MultipleComboBoxContractProps;
