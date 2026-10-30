/**
 * Stackra file contract:
 * Purpose: `CountdownContractProps`, the props every runtime's `Countdown` takes: a countdown to a moment, or a
 *          stopwatch from one, in tabular digits, announced politely once a minute and at the end.
 * Boundary: types only; the clock ticks once a second with no animation.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (wave A, owner request 2026-10-29).
 */

/** Props shared by the web and native `Countdown`. */
export interface CountdownContractProps {
  /** `countdown` (the default) to `to`, or `stopwatch` from `from`. */
  readonly mode?: "countdown" | "stopwatch" | undefined;
  /** The moment a countdown ends. */
  readonly to?: Date | string | undefined;
  /** The moment a stopwatch counts from; defaults to when it first shows. */
  readonly from?: Date | string | undefined;
  /** False to stop the clock where it is. Defaults to true. */
  readonly isRunning?: boolean | undefined;
  /** What is being timed, for example "Offer ends in"; the timer's spoken name. */
  readonly label: string;
  /** Called once when a countdown reaches zero. */
  readonly onComplete?: (() => void) | undefined;
}
