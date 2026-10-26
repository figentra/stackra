/**
 * Stackra file contract:
 * Purpose: `MultiSelectFilterDefinition`: a filter on any of a short list of choices.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0318.
 */
import type { SelectItem } from "#contracts/types/select-item.type";
import type { FilterDefinitionBase } from "#contracts/types/filter-definition-base.type";

/** A filter on any of a short list of choices. */
export interface MultiSelectFilterDefinition extends FilterDefinitionBase<"multi-select"> {
  /** The choices, in the order they are listed. */
  readonly options: readonly SelectItem[];
}
