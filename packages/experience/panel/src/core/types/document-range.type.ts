/**
 * Stackra file contract:
 * Purpose: `DocumentRange`, a dashboard's one range picker: the periods it offers and the one it starts on.
 * Boundary: a type only; it drives every tile whose query takes a `TimeRangeInput`.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 20).
 */
import type { TimeRange } from "#core/enums/time-range.enum";

/** A dashboard's range picker. */
export interface DocumentRange {
  /** The periods offered. */
  readonly ranges: readonly TimeRange[];

  /** The period it starts on; one of `ranges`. */
  readonly default: TimeRange;
}
