/**
 * Stackra file contract:
 * Purpose: `CONSENT_STORAGE_KEY`, the key under which `StorageConsentStoreDriver` keeps the decision in the `prefs`
 *          area of client storage.
 * Boundary: internal and fixed: the decision is a JSON record, not a shape class, so no gen-registered key applies. It
 *           is namespaced by the member key (`consent.`) like every derived storage key.
 * Runtime: isomorphic
 * Governing contract: ADR 0256 (decision 2: the prefs area); ADR 0294 (decision 20: `<member>.<name>` keys).
 */

/** The `prefs` key of the decision. */
export const CONSENT_STORAGE_KEY = "consent.decision";
