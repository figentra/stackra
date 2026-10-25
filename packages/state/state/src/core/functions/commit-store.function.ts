/**
 * Stackra file contract:
 * Purpose: `commitStore`, what follows every change `set` makes: the version moves, the whole state is written to the
 *          store's storage area under its key, every other context of the origin is told (`stackra:state:<area>`), and every listener is called.
 * Boundary: internal. The state is the instance's own enumerable fields that are not functions (getters and methods
 *           live on the prototype), so exactly the fields are persisted. A failed asynchronous write is not swallowed:
 *           its rejection reaches the runtime's error handler.
 * Runtime: isomorphic
 * Governing contract: ADR 0079 (decision 2); ADR 0256.
 */
import { STORE_SYNC_VERSION } from "#core/constants/store-sync-version.constant";
import { internalsOf } from "#core/functions/internals-of.function";

/** Records a change of `store`: bumps the version, persists, notifies. */
export function commitStore(store: object): void {
  const internals = internalsOf(store);
  internals.version += 1;
  if (internals.area !== undefined && internals.key !== undefined) {
    const state = Object.fromEntries(
      Object.entries(store).filter(([, value]) => typeof value !== "function"),
    );
    internals.area.set(internals.key, state);
    internals.channel?.postMessage({ key: internals.key, version: STORE_SYNC_VERSION, state });
  }
  // oxlint-disable-next-line unicorn/no-useless-spread -- reason: a copy, so a listener that unsubscribes another mid-loop does not skip it
  for (const listener of [...internals.listeners]) listener();
}
