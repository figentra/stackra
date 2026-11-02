/**
 * Stackra file contract:
 * Purpose: `Progress`, a running progress bar of a known total.
 * Boundary: a type only. Redrawn in place on a colour terminal; at most one line per 10 percent otherwise (FR-021).
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-018 and FR-021.
 */

/** A progress bar the command advances. */
export interface Progress {
  /** Moves it on by `steps` (1 by default). */
  readonly advance: (steps?: number) => void;

  /** Ends it at its total. */
  readonly finish: () => void;
}
