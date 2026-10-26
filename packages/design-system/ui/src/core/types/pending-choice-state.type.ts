/**
 * Stackra file contract:
 * Purpose: `PendingChoiceState`: what a pending-choice store holds at one moment.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0312.
 */

/** What a pending-choice store holds at one moment; a new object each time it changes, so a reader can compare. */
export interface PendingChoiceState<TRequest> {
  /** The latest question asked, kept after it closes; undefined until the first one. */
  readonly request: TRequest | undefined;
  /** True while a question waits for an answer. */
  readonly isOpen: boolean;
}
