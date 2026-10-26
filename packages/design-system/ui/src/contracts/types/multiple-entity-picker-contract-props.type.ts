/**
 * Stackra file contract:
 * Purpose: `MultipleEntityPickerContractProps`: an EntityPicker that picks several records.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3: one API on web and
 *          native); ADR 0303 (decision 7, props vocabulary); ADR 0318 (wave 7 vocabulary); ADR 0055 (forms: one field
 *          contract); ADR 0165 (UI contract).
 */
import type { EntityOption } from "#contracts/types/entity-option.type";
import type { FieldContractProps } from "#contracts/types/field-contract-props.type";
import type { EntityPickerBaseContractProps } from "#contracts/types/entity-picker-base-contract-props.type";

/** An EntityPicker that picks several records: `value` is the list of them, shown as removable tags. */
export interface MultipleEntityPickerContractProps
  extends EntityPickerBaseContractProps, FieldContractProps<readonly EntityOption[]> {
  /** Several records at once, shown as removable tags. */
  readonly selectionMode: "multiple";
  /** The spoken name of a tag's remove button, from the record's label, for example "Remove Ada Lovelace". */
  readonly removeLabel: (entityLabel: string) => string;
}
