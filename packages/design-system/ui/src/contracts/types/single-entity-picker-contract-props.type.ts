/**
 * Stackra file contract:
 * Purpose: `SingleEntityPickerContractProps`: an EntityPicker that picks one record.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3: one API on web and
 *          native); ADR 0303 (decision 7, props vocabulary); ADR 0318 (wave 7 vocabulary); ADR 0055 (forms: one field
 *          contract); ADR 0165 (UI contract).
 */
import type { EntityOption } from "#contracts/types/entity-option.type";
import type { FieldContractProps } from "#contracts/types/field-contract-props.type";
import type { EntityPickerBaseContractProps } from "#contracts/types/entity-picker-base-contract-props.type";

/** An EntityPicker that picks one record: `value` is the record, and `null` means nothing is chosen. */
export interface SingleEntityPickerContractProps
  extends EntityPickerBaseContractProps, FieldContractProps<EntityOption | null> {
  /** One record at a time. This is the default. */
  readonly selectionMode?: "single" | undefined;
  /** Not used: a single choice has no tag to remove. */
  readonly removeLabel?: undefined;
}
