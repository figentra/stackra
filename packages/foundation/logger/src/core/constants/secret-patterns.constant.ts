/**
 * Stackra file contract:
 * Purpose: `SECRET_PATTERNS`, the secret shapes `redact` masks inside any string, whatever the field is called: a
 *          bearer token, a JWT, well-known API key prefixes and the credentials of a URL.
 * Boundary: global expressions used with `String.prototype.replace` only (never `test`, whose `lastIndex` is
 *           stateful). Each match is replaced by the mask. Internal: not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0147 (decision 1: secret detection); ADR 0173 (nobody reads a value).
 */

/** Secret shapes, matched anywhere in a string. */
export const SECRET_PATTERNS: readonly RegExp[] = Object.freeze([
  // An HTTP bearer credential.
  /\bBearer\s+[\w.~+/-]+=*/gi,
  // A JSON Web Token: three base64url parts, the first a JSON header.
  /\beyJ[\w-]+\.[\w-]+\.[\w-]+/g,
  // Stripe-style secret, publishable and restricted keys.
  /\b(?:sk|pk|rk)_(?:live|test)_[A-Za-z0-9]{8,}/g,
  // GitHub tokens.
  /\bgh[pousr]_[A-Za-z0-9]{20,}/g,
  // Slack tokens.
  /\bxox[abprs]-[A-Za-z0-9-]{10,}/g,
  // AWS access key ids.
  /\bAKIA[0-9A-Z]{16}\b/g,
  // The user and password of a URL (`https://user:pass@host`).
  /(?<=\/\/)[^/\s:@]+:[^/\s@]+(?=@)/g,
]);
