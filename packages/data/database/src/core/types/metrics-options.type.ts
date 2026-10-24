/**
 * Stackra file contract:
 * Purpose: `MetricsOptions<M>`, what `CrudService.metrics(period, options)` takes: the instant field that places a row
 *          in a period (`paidAt`) and the rows that count.
 * Boundary: a type only.
 * Runtime: node
 * Governing contract: ADR 0307 (rule 16).
 */
import type { Where } from "#core/types/where.type";

/** The metrics options. */
export interface MetricsOptions<M extends object> {
  /** The `Date` field whose value falls in the period. */
  readonly on: Extract<keyof M, string>;

  /** The rows that count. */
  readonly where?: Where<M>;
}
