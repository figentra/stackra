/**
 * Stackra file contract:
 * Purpose: `scopeRefOf(path)`, a test's scope reference for a path: the path and a `scp_` public id derived from it, so
 *          the same path gives the same id in every test and every run.
 * Boundary: test code only. The id has the public-id shape (`scp_` and 26 Crockford base32 characters) but is a hash
 *           of the path, never minted by the model, and never a real node's id.
 * Runtime: isomorphic
 * Governing contract: ADR 0269 (decision 3: domain fakes in the owning package's `./testing`); ADR 0135 (id format);
 *                     ADR 0327.
 */
import type { ScopeRef } from "@stackra/contracts";

import { isScopePath } from "#core/index";

/** Crockford base32, lowercase. */
const ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz";

/**
 * The reference of `path`.
 *
 * @throws RangeError when `path` is not a scope path.
 * @example
 * const acme = scopeRefOf("platform.acme"); // { id: "scp_…", path: "platform.acme" }
 */
export function scopeRefOf(path: string): ScopeRef {
  if (!isScopePath(path)) throw new RangeError(`"${path}" is not a scope path`);
  let hash = 0x811c9dc5;
  let body = "";
  for (let round = 0; body.length < 26; round += 1) {
    for (const char of `${round}:${path}`) hash = Math.imul(hash ^ char.charCodeAt(0), 0x01000193);
    for (let bits = hash >>> 0, left = 6; left > 0 && body.length < 26; left -= 1, bits >>>= 5)
      body += ALPHABET[bits & 31];
  }
  return Object.freeze({ id: `scp_${body}`, path });
}
