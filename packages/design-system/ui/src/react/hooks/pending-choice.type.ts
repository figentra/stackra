/**
 * Stackra file contract:
 * Purpose: `PendingChoice`: what `usePendingChoice` returns.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0312.
 */
import type { PendingChoiceStore } from "#core/types/pending-choice-store.type";
import type { PendingChoiceState } from "#core/types/pending-choice-state.type";

/** What {@link usePendingChoice} returns: the current state, and the store's `ask` and `settle`. */
export type PendingChoice<TRequest> = PendingChoiceState<TRequest> &
  Pick<PendingChoiceStore<TRequest>, "ask" | "settle">;
