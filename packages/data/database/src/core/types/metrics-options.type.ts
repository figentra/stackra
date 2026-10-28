/**
 * Stackra file contract:
 * Purpose: `MetricsOptions<M>`, what `CrudService.metrics(period, options)` takes: the instant field that places a row
 *          in a period (`paidAt`), the rows that count, and the time zone a series buckets in.
 * Boundary: a type only.
 * Runtime: node
 * Governing contract: ADR 0307 (rule 16); ADR 0136 (decision 1: the time zone); reporting gap 10.
 */
import type { Where } from "#contracts/types/where.type";

/** The metrics options. */
export interface MetricsOptions<M extends object> {
  /** The `Date` field whose value falls in the period. */
  readonly on: Extract<keyof M, string>;

  /** The rows that count. */
  readonly where?: Where<M>;

  /**
   * The IANA time zone a series buckets in (`ctx.timeZone`). `CrudService.metrics` falls back to the running call's
   * time zone, and outside a call to UTC.
   */
  readonly timeZone?: string;
}
