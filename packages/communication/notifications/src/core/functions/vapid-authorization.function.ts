/**
 * Stackra file contract:
 * Purpose: `vapidAuthorization(input)`, the `Authorization: vapid t=…, k=…` header of one Web Push request: an ES256 JWT
 *          for the push service's origin, signed with the platform's VAPID key pair.
 * Boundary: Web Crypto only. The keys are the raw base64url forms browsers use (a 65-byte public point, a 32-byte
 *           private scalar); the private key is imported, used and dropped, never returned. The subject is a contact
 *           URL or `mailto:`.
 * Runtime: isomorphic
 * Governing contract: RFC 8292 (VAPID); RFC 7515 (JWS).
 */
import { base64url } from "#core/functions/base64url.function";

/** `value` as JSON, base64url-encoded: one JWT segment. */
const encode = (value: object) => base64url(new TextEncoder().encode(JSON.stringify(value)));

/**
 * The VAPID header for `endpoint`.
 *
 * @example
 * await vapidAuthorization({ endpoint, publicKey, privateKey, subject: "mailto:push@platform.example", now });
 */
export async function vapidAuthorization(input: {
  readonly endpoint: string;
  readonly publicKey: string;
  readonly privateKey: string;
  readonly subject: string;
  readonly now: Date;
}): Promise<string> {
  const point = base64url.decode(input.publicKey);
  if (point.length !== 65 || point[0] !== 4)
    throw new TypeError("vapidAuthorization: the public key is not a P-256 point");
  const key = await crypto.subtle.importKey(
    "jwk",
    {
      kty: "EC",
      crv: "P-256",
      x: base64url(point.slice(1, 33)),
      y: base64url(point.slice(33, 65)),
      d: input.privateKey,
    },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const claims = {
    aud: new URL(input.endpoint).origin,
    exp: Math.floor(input.now.getTime() / 1000) + 12 * 3600,
    sub: input.subject,
  };
  const unsigned = `${encode({ typ: "JWT", alg: "ES256" })}.${encode(claims)}`;
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(unsigned),
  );
  return `vapid t=${unsigned}.${base64url(signature)}, k=${input.publicKey}`;
}
