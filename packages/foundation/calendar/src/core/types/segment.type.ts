/**
 * Stackra file contract:
 * Purpose: `Segment`, one part of a booking's duration: time that holds the resource, or a processing gap (colour
 *          developing, a cast setting) when the resource is free for someone else.
 * Boundary: a type only. `minutes` is a positive whole number.
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decision 7: slots with duration segments).
 */

/** One part of a booking. */
export interface Segment {
  /** Its length in minutes. */
  readonly minutes: number;

  /** `true` when the resource is held; `false` for a processing gap. */
  readonly occupies: boolean;
}
