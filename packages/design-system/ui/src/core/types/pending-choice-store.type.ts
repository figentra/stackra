/**
 * Stackra file contract:
 * Purpose: `PendingChoiceStore`: a store of one pending yes-or-no question.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0312.
 */
import type { PendingChoiceState } from "#core/types/pending-choice-state.type";

/** A store of one pending yes-or-no question. */
export interface PendingChoiceStore<TRequest> {
  /** The current state; the same object until something changes. */
  readonly getState: () => PendingChoiceState<TRequest>;
  /** Calls `listener` after every change; returns the function that stops it. */
  readonly subscribe: (listener: () => void) => () => void;
  /** Opens a question and resolves true for a yes and false for a no; a new question refuses the one before it. */
  readonly ask: (request: TRequest) => Promise<boolean>;
  /** Answers the open question, if any, and closes it; with nothing open it does nothing. */
  readonly settle: (choice: boolean) => void;
}
