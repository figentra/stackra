/**
 * Stackra file contract:
 * Purpose: `usePendingActions()`, the hook the web and native `BulkActionBar` and `DataTable` run a `ResourceAction`
 *          with: it calls the action's handler, and when the handler returns a promise it marks the action pending
 *          until that promise settles and refuses a second run in the meantime, so a double press or tap never runs an
 *          action twice.
 * Boundary: React glue only, in the shared React layer: internal, not in a barrel; both runtimes import it by path. A
 *           pending set is kept by a caller-chosen key (an action id for the bar, a row id with an action id for a
 *           row menu). A handler that returns nothing is never
 *           pending, and one that throws synchronously leaves nothing pending and throws on to the caller. A rejection
 *           is swallowed after the pending mark is cleared: the bar has no channel to report it, and the app reports
 *           its own failures inside its handler (ADR 0139). Nothing here touches the selection, so a rejection leaves
 *           it as it was (ADR 0318 decision 5).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0318 (decision 5); ADR 0139 (action UX).
 */
import { useRef, useState } from "react";

/** What {@link usePendingActions} returns. */
interface PendingActions {
  /** The keys of the actions whose promise has not settled yet. */
  readonly pending: readonly string[];
  /** Runs `action` under `key`; does nothing while that key is pending. */
  readonly run: (key: string, action: (() => void | Promise<void>) | undefined) => void;
}

/** Says whether a handler's result is a promise (or any thenable) rather than nothing. */
function isThenable(value: unknown): value is PromiseLike<unknown> {
  return typeof (value as { readonly then?: unknown } | null | undefined)?.then === "function";
}

/**
 * Tracks which actions are running and refuses to run one twice.
 * @returns the pending keys and the function that runs an action under a key
 */
export function usePendingActions(): PendingActions {
  const [pending, setPending] = useState<readonly string[]>([]);
  // A ref as well as state: two presses or taps in one tick both read the same render's state, but not the same ref.
  const inFlight = useRef<ReadonlySet<string>>(new Set());

  const settle = (key: string) => {
    inFlight.current = new Set([...inFlight.current].filter((other) => other !== key));
    setPending((keys) => keys.filter((other) => other !== key));
  };

  const run = (key: string, action: (() => void | Promise<void>) | undefined) => {
    if (inFlight.current.has(key)) return;
    const result: unknown = action?.();
    if (!isThenable(result)) return;
    inFlight.current = new Set([...inFlight.current, key]);
    setPending((keys) => [...keys, key]);
    // `then` with both arms, not `finally`: a thenable need not have one, and the rejection ends here.
    result.then(
      () => settle(key),
      () => settle(key),
    );
  };

  return { pending, run };
}
