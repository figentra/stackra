/**
 * Stackra file contract:
 * Purpose: `STORE_SYNC_VERSION`, the version of the message a persisted store broadcasts to the other contexts of its
 *          origin (`{ key, version, state }`).
 * Boundary: internal; a receiver ignores a message of another version, so a tab running older code never applies a
 *           shape it does not know. Bump it when the message or the persisted state's shape changes.
 * Runtime: isomorphic
 * Governing contract: ADR 0079 (decision 2, cross-tab sync of persisted stores); ADR 0256.
 */

/** The version of the cross-tab message. */
export const STORE_SYNC_VERSION = 1;
