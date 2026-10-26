/**
 * Stackra file contract:
 * Purpose: `FilterValueByKind`: the value type of each filter kind.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0318.
 */
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
