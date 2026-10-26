/**
 * Stackra file contract:
 * Purpose: `commitStore`, what follows every change `set` makes: the version moves, the whole state is written to the
 *          store's storage area under its key, every other context of the origin is told (`stackra:state:<area>`), and every listener is called.
 * Boundary: internal. The state is the instance's own enumerable fields that are not functions (getters and methods
 *           live on the prototype), so exactly the fields are persisted. A failed asynchronous write is not swallowed:
 *           its rejection reaches the runtime's error handler. While an asynchronous hydration runs, the write waits for
 *           it, so the saved fields it applies are not replaced by defaults.
 * Runtime: isomorphic
 * Governing contract: ADR 0079 (decision 2); ADR 0256.
 */
import { STORE_SYNC_VERSION } from "#core/constants/store-sync-version.constant";
import { internalsOf } from "#core/functions/internals-of.function";

/** Records a change of `store`: bumps the version, persists, notifies. */
export function commitStore(store: object): void {
  const internals = internalsOf(store);
  internals.version += 1;
  const { area, key } = internals;
  if (area !== undefined && key !== undefined) {
    const persist = (): void => {
      const state = Object.fromEntries(
        Object.entries(store).filter(([, value]) => typeof value !== "function"),
      );
      area.set(key, state);
      internals.channel?.postMessage({ key, version: STORE_SYNC_VERSION, state });
    };
    // An asynchronous read still running: write after it, so the saved fields it applies are kept.
    if (internals.hydration instanceof Promise) void internals.hydration.then(persist);
    else persist();
  }
  // oxlint-disable-next-line unicorn/no-useless-spread -- reason: a copy, so a listener that unsubscribes another mid-loop does not skip it
  for (const listener of [...internals.listeners]) listener();
}
