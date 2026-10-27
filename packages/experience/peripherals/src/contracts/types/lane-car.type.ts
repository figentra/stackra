/**
 * Stackra file contract:
 * Purpose: `LaneCar`, one reading of a drive-through lane's car sensor: which lane, and whether a car now stands at the
 *          order point.
 * Boundary: a type only. The time is the listener's (it stamps the event with its own clock), so a sensor's clock
 *           never decides a speed-of-service timer.
 * Runtime: isomorphic
 * Governing contract: ADR 0253; STA-965.
 */

/** A car arrived at, or left, a lane's order point. */
export interface LaneCar {
  /** The lane key. */
  readonly lane: string;

  /** True when a car stands at the order point now. */
  readonly isPresent: boolean;
}
