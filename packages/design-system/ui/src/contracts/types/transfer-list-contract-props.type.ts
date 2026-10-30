/**
 * Stackra file contract:
 * Purpose: `TransferListContractProps`, the props every runtime's `TransferList` takes: two lists, the available items
 *          and the chosen ones, each with ticks, a filter and a count, and buttons that move the ticked items (or all
 *          shown) between them. The value is the chosen keys.
 * Boundary: types only; the chosen keys keep the order of `items`.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0055 (one field contract); STA-1371 (wave D, owner approval
 *          2026-10-30).
 */
import type { FieldContractProps } from "#contracts/types/field-contract-props.type";
import type { SelectItem } from "#contracts/types/select-item.type";

/** Props shared by the web and native `TransferList`. */
export interface TransferListContractProps extends FieldContractProps<readonly string[]> {
  /** Every item, chosen or not; a disabled item stays where it is. */
  readonly items: readonly SelectItem[];
  /** The available list's title. Defaults to the catalogue's "Available". */
  readonly availableLabel?: string | undefined;
  /** The chosen list's title. Defaults to the catalogue's "Chosen". */
  readonly chosenLabel?: string | undefined;
}
