/**
 * Stackra file contract:
 * Purpose: `ListItemData`: a row as an entry of a list.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0313 (text slots).
 */
import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { ListItemContractProps } from "#contracts/types/list-item-contract-props.type";

/** A row as an entry of a list: the row's props and the `id` the list keys it and its selection by. */
export interface ListItemData extends ListItemContractProps, CollectionItem {}
