/**
 * Stackra file contract:
 * Purpose: `ProjectionRow<S>`, one record of a projection as a read returns it: the record id, its data and the time
 *          that version took effect.
 * Boundary: a type only. The data is the JSON the projection stored, so dates come back as ISO strings.
 * Runtime: node
 * Governing contract: ADR 0163 (decision 1: read models with `asOf`).
 */

/** One record of a projection. */
export interface ProjectionRow<S extends object = object> {
  /** The record id the projection stored it under (usually the source record's public id). */
  readonly id: string;

  /** The stored data. */
  readonly data: S;

  /** When this version took effect: the `at` of the event that wrote it. */
  readonly validFrom: Date;
}
