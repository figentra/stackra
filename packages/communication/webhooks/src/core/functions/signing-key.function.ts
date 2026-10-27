/**
 * Stackra file contract:
 * Purpose: `signingKey`, the HMAC-SHA256 Web Crypto key of a webhook secret: a `whsec_<base64>` secret (Standard
 *          Webhooks, Svix) is its decoded bytes, any other secret its UTF-8 bytes.
 * Boundary: internal; `signWebhook` and `verifyWebhook` share it so both read a secret the same way. The key is not
 *           extractable and the secret never appears in an error.
 * Runtime: isomorphic
 * Governing contract: the Standard Webhooks specification; ADR 0173 (nobody reads a value).
 */
import { decodeBase64 } from "@stackra/support";

/** The prefix of a Standard Webhooks secret. */
const SECRET_PREFIX = "whsec_";

/**
 * The key for `usage`.
 *
 * @throws TypeError when the secret is empty, or a `whsec_` secret whose rest is not Base64.
 * @example
 * const key = await signingKey("whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw", "verify");
 */
export async function signingKey(secret: string, usage: "sign" | "verify"): Promise<CryptoKey> {
  const bytes = secret.startsWith(SECRET_PREFIX)
    ? decodeBase64(secret.slice(SECRET_PREFIX.length))
    : new TextEncoder().encode(secret);
  if (bytes === undefined || bytes.length === 0)
    throw new TypeError("A webhook secret is a non-empty string, or whsec_ followed by Base64");
  return crypto.subtle.importKey("raw", bytes, { name: "HMAC", hash: "SHA-256" }, false, [usage]);
}
