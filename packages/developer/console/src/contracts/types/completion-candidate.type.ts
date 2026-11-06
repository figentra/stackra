/**
 * Stackra file contract:
 * Purpose: `CompletionCandidate`, one word Tab may complete (a command, an option, a choice) with its description.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: STA-1966 spec FR-006.
 */

/** A word Tab offers. */
export interface CompletionCandidate {
  /** The word Tab inserts. */
  readonly value: string;

  /** What it is, shown beside it by shells that can. */
  readonly description: string;
}
