/**
 * Stackra file contract:
 * Purpose: `usePendingChoice()`, the hook the web `ConfirmationProvider` and `LeaveConfirmation` hold their one
 *          yes-or-no question with: it keeps a `createPendingChoice` store for the life of the component and re-renders
 *          it on every change.
 * Boundary: React glue only; the questions, the promises and the replacement rule are the store's. Internal: not in
 *           the `./react` barrel. When its owner unmounts with a question open, the question is answered no, so the
 *           caller who awaited it never waits for ever.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0312.
 */
import { useEffect, useState, useSyncExternalStore } from "react";

import { createPendingChoice } from "#core/functions/create-pending-choice.function";
import type { PendingChoice } from "#react/confirmation/pending-choice.type";

/**
 * Holds one pending yes-or-no question for the component. `ask` and `settle` keep their identity across renders, so
 * they are safe in a context value or a dependency list.
 * @returns the latest question, whether it is open, and the functions that ask and answer it
 */
export function usePendingChoice<TRequest = void>(): PendingChoice<TRequest> {
  const [store] = useState(() => createPendingChoice<TRequest>());
  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState);
  useEffect(() => () => store.settle(false), [store]);
  return { ...state, ask: store.ask, settle: store.settle };
}
