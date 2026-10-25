/**
 * Stackra file contract:
 * Purpose: `ACTIVE_SCOPE_STORAGE_KEY`, the key a device keeps its last active scope under in the `prefs` storage area.
 * Boundary: internal to `./native`; one key per install, holding `{ id, path }` only.
 * Runtime: isomorphic
 * Governing contract: ADR 0327 (decision 10); ADR 0256 (decision 2: the `prefs` area).
 */

/** The `prefs` key of the remembered scope. */
export const ACTIVE_SCOPE_STORAGE_KEY = "scope.active_scope";
