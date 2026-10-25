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
import type { CalendarDate } from "@internationalized/date";

import type { FilterKind } from "#contracts/enums/filter-kind.enum";
import type { IconSlot } from "#contracts/types/icon-slot.type";
import type { NumberFieldContractProps } from "#contracts/types/number-field-contract-props.type";
import type { SelectItem } from "#contracts/types/select-item.type";

/** What every filter definition carries, whatever its kind. */
export interface FilterDefinitionBase<TKind extends FilterKind> {
  /** The key of the filter; unique in the list, and the key its value has in a `FilterState`. */
  readonly id: string;
  /** The name of the filter, shown in the add-filter menu and on its chip; it is also its accessible name. */
  readonly label: string;
  /** Which editor the filter opens and which value it holds. */
  readonly kind: TKind;
  /** An icon drawn before the label in the add-filter menu: an icon name or any icon element. */
  readonly icon?: IconSlot | undefined;
  /** True to list the filter but refuse adding it, for example while its options load. */
  readonly isDisabled?: boolean | undefined;
}

/** A filter on text the records contain. */
export interface TextFilterDefinition extends FilterDefinitionBase<"text"> {
  /** Hint text drawn inside the empty editor. */
  readonly placeholder?: string | undefined;
}

/** A filter on a number range; the bounds, step and format are NumberField's. */
export interface NumberFilterDefinition
  extends
    FilterDefinitionBase<"number">,
    Pick<NumberFieldContractProps, "minValue" | "maxValue" | "step" | "formatOptions"> {}

/** A filter on one of a short list of choices. */
export interface SelectFilterDefinition extends FilterDefinitionBase<"select"> {
  /** The choices, in the order they are listed. */
  readonly options: readonly SelectItem[];
}

/** A filter on any of a short list of choices. */
export interface MultiSelectFilterDefinition extends FilterDefinitionBase<"multi-select"> {
  /** The choices, in the order they are listed. */
  readonly options: readonly SelectItem[];
}

/** A filter on a range of calendar days. */
export interface DateRangeFilterDefinition extends FilterDefinitionBase<"date-range"> {
  /** The earliest day the editor accepts. */
  readonly minValue?: CalendarDate | undefined;
  /** The latest day the editor accepts. */
  readonly maxValue?: CalendarDate | undefined;
}

/** A filter on a yes or no flag. */
export interface BooleanFilterDefinition extends FilterDefinitionBase<"boolean"> {
  /** The text of the yes choice and of the chip when it is picked. Defaults to an English word until i18n ships. */
  readonly trueLabel?: string | undefined;
  /** The text of the no choice and of the chip when it is picked. Defaults to an English word until i18n ships. */
  readonly falseLabel?: string | undefined;
}

/** One filter of a resource index, told apart by its `kind`. */
export type FilterDefinition =
  | TextFilterDefinition
  | NumberFilterDefinition
  | SelectFilterDefinition
  | MultiSelectFilterDefinition
  | DateRangeFilterDefinition
  | BooleanFilterDefinition;
