/**
 * Stackra file contract:
 * Purpose: the props every runtime's `EntityPicker` takes: the field contract over the chosen record (one, or a list
 *          in multiple mode), the async `loadOptions(search, cursor)` that answers a search a page at a time, the pause
 *          before a search starts, the placeholder, full width, the words of the loading, empty and failed states, and
 *          the create-new action. Each runtime's `EntityPickerProps` is this plus its renderer's own props, which pass
 *          through unchanged.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7, props vocabulary);
 *          ADR 0318 (wave 7 vocabulary); ADR 0055 (forms: one field contract); ADR 0165 (UI contract).
 */

import type { SingleEntityPickerContractProps } from "#contracts/types/single-entity-picker-contract-props.type";
import type { MultipleEntityPickerContractProps } from "#contracts/types/multiple-entity-picker-contract-props.type";

/** Props shared by the web and native `EntityPicker`: the single or the multiple form, told apart by `selectionMode`. */
export type EntityPickerContractProps =
  | SingleEntityPickerContractProps
  | MultipleEntityPickerContractProps;
