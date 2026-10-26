/**
 * Stackra file contract:
 * Purpose: one filter a resource index offers: its key, its name, the kind that picks its editor, and the few extra
 *          props that kind needs (the options of a choice, the bounds of a number or a date, the words of a yes or
 *          no). The app lists them once and FilterBar draws the add-filter menu, the chips and the editors from them.
 * Boundary: types only; a union told apart by `kind`. Choices are the short `SelectItem` list of wave 3, so a filter
 *           with thousands of options is not a `select` filter. The number and date bounds reuse the names of
 *           NumberField and the date fields, so one vocabulary reaches the editor.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0318.
 */

import type { TextFilterDefinition } from "#contracts/types/text-filter-definition.type";
import type { NumberFilterDefinition } from "#contracts/types/number-filter-definition.type";
import type { SelectFilterDefinition } from "#contracts/types/select-filter-definition.type";
import type { MultiSelectFilterDefinition } from "#contracts/types/multi-select-filter-definition.type";
import type { DateRangeFilterDefinition } from "#contracts/types/date-range-filter-definition.type";
import type { BooleanFilterDefinition } from "#contracts/types/boolean-filter-definition.type";

/** One filter of a resource index, told apart by its `kind`. */
export type FilterDefinition =
  | TextFilterDefinition
  | NumberFilterDefinition
  | SelectFilterDefinition
  | MultiSelectFilterDefinition
  | DateRangeFilterDefinition
  | BooleanFilterDefinition;
