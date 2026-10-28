/**
 * Stackra file contract:
 * Purpose: `StrictLoadingOptions`, what `strictLoading` checks a block against: the most statements it may run, and how
 *          many times one statement shape may run before it is an N+1 loop.
 * Boundary: a type only, for tests.
 * Runtime: node
 * Governing contract: data-layer gaps scale-performance 8 and model-orm 12 (stackra-282, STA-1400).
 */

/** The limits of a strict block. */
export interface StrictLoadingOptions {
  /** The most statements the block may run; no count limit when absent. */
  readonly budget?: number;

  /** How many times one statement shape may run; `1` when absent, so any repeated statement fails. */
  readonly repeats?: number;
}
