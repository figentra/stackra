/**
 * Stackra file contract:
 * Purpose: holds one yes-or-no question and its answer as a promise, so `useConfirmation()` and `LeaveConfirmation`
 *          share one mechanism on web and native: `ask` opens the question and returns a promise, `settle` answers it
 *          and closes it, and a question nobody answers resolves false when it is replaced or its owner settles it
 *          on the way out.
 * Boundary: a plain store with no React and no dialog in it, so core stays free of host libraries; each runtime's
 *           `usePendingChoice` reads it with `useSyncExternalStore`. Internal: not in the `.` barrel, `react/` and
 *           `native/` import it by path. The question stays in `request` while the dialog closes, so an exit
 *           animation still has its words to draw.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0312.
 */
import type { PendingChoiceState } from "#core/types/pending-choice-state.type";
import type { PendingChoiceStore } from "#core/types/pending-choice-store.type";

/**
 * Creates a store that holds one pending yes-or-no question. Its functions are bound, so they keep their identity and
 * can be passed around, into a context value or a dependency list.
 * @returns the store: its state, a subscription, and the functions that ask and answer the question
 */
export function createPendingChoice<TRequest = void>(): PendingChoiceStore<TRequest> {
  let state: PendingChoiceState<TRequest> = { request: undefined, isOpen: false };
  let resolver: ((choice: boolean) => void) | undefined;
  const listeners = new Set<() => void>();

  const change = (next: PendingChoiceState<TRequest>) => {
    state = next;
    for (const listener of listeners) listener();
  };

  return {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    ask: (request) =>
      new Promise<boolean>((resolve) => {
        // A question that is replaced is refused, never left hanging and never taken as a yes.
        resolver?.(false);
        resolver = resolve;
        change({ request, isOpen: true });
      }),
    settle: (choice) => {
      if (resolver === undefined) return;
      resolver(choice);
      resolver = undefined;
      change({ ...state, isOpen: false });
    },
  };
}
