/**
 * Stackra file contract:
 * Purpose: `verifyVisitorToken(token, keys)`, the visitor id a signed token names, and which key signed it, or
 *          `undefined` for a token that is malformed or that no key signed.
 * Boundary: checks the signature with Web Crypto's `verify` (constant time) against each non-empty key in order, the
 *           current one first; never throws for bad input, so a forged or stale token only makes a new visitor.
 * Runtime: node
 * Governing contract: ADR 0173 (secrets); STA-2025 (as amended 2026-11-09: one visitor id across requests).
 */
import type { PublicId } from "@stackra/contracts";

/** `v1.anon_<26 lower-case base32 characters>.<base64url signature>`. */
const TOKEN = /^v1\.(anon_[0-9a-z]{26})\.([\w-]{43})$/;

/**
 * Verifies `token` against `keys`.
 *
 * @param token - what the caller carried back (header or cookie).
 * @param keys - the current key first, then the previous one; empty keys are skipped.
 * @returns the id and the index of the key that signed it (0 is current), or `undefined`.
 * @example
 * const visitor = await verifyVisitorToken(header, [config.signingKey, config.previousSigningKey]);
 */
export async function verifyVisitorToken(
  token: string,
  keys: readonly string[],
): Promise<{ readonly id: PublicId; readonly key: number } | undefined> {
  const match = TOKEN.exec(token);
  if (match === null) return undefined;
  const [, id, signature] = match;
  const payload = new TextEncoder().encode(`v1.${id}`);
  const signed = Buffer.from(signature ?? "", "base64url");
  for (const [index, key] of keys.entries()) {
    if (key === "") continue;
    // oxlint-disable-next-line no-await-in-loop -- reason: at most two keys, the current one first
    const hmac = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(key),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    // oxlint-disable-next-line no-await-in-loop -- reason: as above
    if (await crypto.subtle.verify("HMAC", hmac, signed, payload))
      return { id: id as PublicId, key: index };
  }
  return undefined;
}
