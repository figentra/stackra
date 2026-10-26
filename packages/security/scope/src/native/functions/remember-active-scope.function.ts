/**
 * Stackra file contract:
 * Purpose: `rememberActiveScope`, how a device app keeps the scope its user last switched to across launches: it
 *          restores the remembered `{ id, path }` from the `prefs` storage area into `ActiveScopeService` once, then
 *          writes every later switch back (and removes it when the scope is cleared).
 * Boundary: a web app keeps its scope in the route, so this lives in `./native`. What is stored is untrusted: a value
 *           that is not a `scp_` id with a valid scope path is dropped and nothing is restored. Restoring widens no
 *           access, as with any client choice: the server accepts `X-Scope-Path` only within the caller's grants.
 *           Call it after the storage is hydrated.
 * Runtime: isomorphic
 * Governing contract: ADR 0327 (decisions 7 and 10); ADR 0256 (decision 2); ADR 0079 (client state).
 */
import type { ScopeRef } from "@stackra/contracts";
import type { StorageAreaHandle } from "@stackra/storage/contracts";

import type { ActiveScopeService } from "#core/index";
import { isScopePath } from "#core/index";
import { ACTIVE_SCOPE_STORAGE_KEY } from "#native/constants/active-scope-storage-key.constant";

/** A scope node's public id. */
const SCOPE_ID = /^scp_[0-9a-hjkmnp-tv-z]{26}$/;

/** The stored scope, when it is one. */
function storedScope(value: unknown): ScopeRef | null {
  if (typeof value !== "object" || value === null) return null;
  const { id, path } = value as Record<string, unknown>;
  if (typeof id !== "string" || typeof path !== "string") return null;
  return SCOPE_ID.test(id) && isScopePath(path) ? { id: id as ScopeRef["id"], path } : null;
}

/**
 * Restores the remembered scope and remembers every switch; returns the function that stops remembering.
 *
 * @example
 * await storage.hydrate();
 * const stop = rememberActiveScope(container.get(ActiveScopeService), storage.prefs);
 */
export function rememberActiveScope(
  active: ActiveScopeService,
  prefs: StorageAreaHandle,
): () => void {
  const remembered = storedScope(prefs.get(ACTIVE_SCOPE_STORAGE_KEY));
  if (remembered === null) prefs.delete(ACTIVE_SCOPE_STORAGE_KEY);
  else if (active.current() === null) active.set(remembered);
  return active.subscribe(() => {
    const scope = active.current();
    if (scope === null) prefs.delete(ACTIVE_SCOPE_STORAGE_KEY);
    else prefs.set(ACTIVE_SCOPE_STORAGE_KEY, { id: scope.id, path: scope.path });
  });
}
