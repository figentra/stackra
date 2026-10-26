/**
 * Stackra file contract:
 * Purpose: `scopeIdOf(path)`, the test scope id of a path: `scp_` and 26 Crockford base32 characters hashed from the
 *          path, so the same path gives the same id in every test and every run.
 * Boundary: internal to the `.` entry (the tenant factories read it; not re-exported). Test ids only, never minted by
 *           a model. The hash is the one `scopeRefOf` in `@stackra/scope/testing` uses, written out here so this
 *           package imports no workspace code (ADR 0269 decision 2): a path gets the same id from either helper.
 * Runtime: isomorphic
 * Governing contract: ADR 0269 (decision 2); ADR 0135 (id format); ADR 0327 (decision 3).
 */

/** Crockford base32, lowercase. */
const ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz";

/**
 * The id of `path`.
 *
 * @example
 * scopeIdOf("platform.acme"); // "scp_…" (26 characters after the prefix, the same on every run)
 */
export function scopeIdOf(path: string): `scp_${string}` {
  let hash = 0x811c9dc5;
  let body = "";
  for (let round = 0; body.length < 26; round += 1) {
    for (const char of `${round}:${path}`) hash = Math.imul(hash ^ char.charCodeAt(0), 0x01000193);
    for (let bits = hash >>> 0, left = 6; left > 0 && body.length < 26; left -= 1, bits >>>= 5)
      body += ALPHABET[bits & 31];
  }
  return `scp_${body}`;
}
