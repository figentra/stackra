/**
 * Stackra file contract:
 * Purpose: `HeroEntry`, one landing hero the apps may show: its id, its weight as a first visit's hero and the dates
 *          it runs between.
 * Boundary: a type only, in its own file; each app keeps its own list of these beside its hero components.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); owner decision 2026-10-28 (rotating landing heroes).
 */

/** A landing hero in the rotation. */
export interface HeroEntry {
  /** The hero's id, also its `?hero=` value ("stack"). */
  readonly id: string;
  /** Its chance as a first visit's hero, against the others' weights; 0 takes it out of the rotation. Defaults to 1. */
  readonly weight?: number;
  /** The first day it shows, an ISO date ("2026-11-01"); none: from now. */
  readonly from?: string;
  /** The day it stops showing, an ISO date, not included; none: no end. */
  readonly until?: string;
}
