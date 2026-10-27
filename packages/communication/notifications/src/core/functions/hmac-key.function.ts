/**
 * Stackra file contract:
 * Purpose: `hmacKey(secret, use)`, the HMAC-SHA256 Web Crypto key of the unsubscribe secret, for signing or verifying.
 * Boundary: internal (not exported from `.`); refuses an empty secret so a token is never signed with nothing. The
 *           key is not extractable.
 * Runtime: isomorphic
 * Governing contract: RFC 2104 (HMAC); stackra-218 (STA-1376).
 */

/** The HMAC key of `secret`. */
export function hmacKey(secret: string, use: "sign" | "verify"): Promise<CryptoKey> {
  if (secret === "")
    throw new TypeError(
      "unsubscribe token: no key (set the NOTIFICATIONS_UNSUBSCRIBE_KEY secret, notifications.unsubscribeKey)",
    );
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [use],
  );
}
