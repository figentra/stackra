/**
 * Stackra file contract:
 * Purpose: `CSP_NONCE_PATTERN`, the grammar of a nonce `contentSecurityPolicy` accepts: base64 or base64url, the form
 *          `createNonce` mints and CSP's `nonce-source` allows.
 * Boundary: refuses anything that could close the `'nonce-…'` source and inject another. Internal: not exported from
 *           the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0237 (edge headers).
 */

/** Base64 or base64url characters with at most two padding signs. */
export const CSP_NONCE_PATTERN = /^[A-Za-z0-9+/_-]+={0,2}$/;
