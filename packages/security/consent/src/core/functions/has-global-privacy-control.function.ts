/**
 * Stackra file contract:
 * Purpose: `hasGlobalPrivacyControl()`, whether the browser sends the Global Privacy Control signal
 *          (`navigator.globalPrivacyControl === true`), which the ledger reads as a refusal of every optional category.
 * Boundary: internal; read on each call, never cached. Outside a browser (a server render, a device app) there is no
 *           signal and it answers `false`; the server never reads the `Sec-GPC` header, because consent state lives
 *           only in the client.
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decisions 2 and 6).
 */

/**
 * Whether Global Privacy Control is on.
 *
 * @example
 * if (hasGlobalPrivacyControl()) return ConsentStatus.Denied;
 */
export function hasGlobalPrivacyControl(): boolean {
  // `globalPrivacyControl` is not in the DOM typings yet.
  const scope = globalThis as { readonly navigator?: { readonly globalPrivacyControl?: unknown } };
  return scope.navigator?.globalPrivacyControl === true;
}
