/**
 * Stackra file contract:
 * Purpose: what a filter holds once the user has set it, per kind, and the whole set of applied filters as one plain
 *          object keyed by the filter's `id`. A filter that is not applied has no key, so the object is also the
 *          honest answer to "what is filtered right now".
 * Boundary: types only. The object is serialisable except for the `CalendarDate`s of a date range, which a URL codec
 *           writes as ISO text. Which kind a key holds comes from its `FilterDefinition`, never from the value.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0318.
 */
import type { FilterKind } from "#contracts/enums/filter-kind.enum";
import type { DateRangeValue } from "#contracts/types/date-range-value.type";
import type { NumberRangeValue } from "#contracts/types/number-range-value.type";

/** The value type of each filter kind: text and select hold a string, the rest as named. */
export interface FilterValueByKind {
  /** Text the matching records contain. */
  readonly text: string;
  /** An inclusive number range. */
  readonly number: NumberRangeValue;
  /** The key of the one chosen option. */
  readonly select: string;
  /** The keys of the chosen options, in the order the options are listed. */
  readonly "multi-select": readonly string[];
  /** An inclusive range of calendar days. */
  readonly "date-range": DateRangeValue;
  /** True for records where the flag is set, false for records where it is not. */
  readonly boolean: boolean;
}

/** The value of one filter, whatever its kind. */
export type FilterValue = FilterValueByKind[FilterKind];

/** The applied filters, by filter `id`. A filter with no key is not applied. */
export type FilterState = Readonly<Record<string, FilterValue>>;
