/**
 * Stackra file contract:
 * Purpose: `EntityOptionsLoader`: the store `createEntityOptionsLoader` returns.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0318 (wave 7
 *          vocabulary, decision 2: cursor pages).
 */
import type { EntityOptionsState } from "#core/types/entity-options-state.type";

/** The store `createEntityOptionsLoader` returns. */
export interface EntityOptionsLoader {
  /** The current state; the same object until something changes. */
  readonly getState: () => EntityOptionsState;
  /** Calls `listener` after every change; returns the function that stops it. */
  readonly subscribe: (listener: () => void) => () => void;
  /** Asks for the first page of `text`: at once the first time, after the pause when it is not the first. */
  readonly search: (text: string) => void;
  /** Asks for the page after the last one; does nothing while a request is on its way or when there is no next page. */
  readonly loadMore: () => void;
  /** Stops the pause and drops any answer still on its way; the store is not used after it. */
  readonly dispose: () => void;
}
