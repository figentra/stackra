/**
 * Stackra file contract:
 * Purpose: `signJwt`, the bearer token of a `Jwt` integration and the assertion of an `OAuth2JwtBearer` one: a compact
 *          JWS with `iat`, `exp`, the declared `iss`, `sub` and `aud` and any extra claims (`scope`), signed with HS256
 *          (a shared secret), RS256 or ES256 (a PKCS #8 PEM private key).
 * Boundary: internal; the managed client calls it per request with the key resolved from its placeholder. Web Crypto
 *           only (`crypto.subtle`), so it runs in Node, Workers and the browser alike. The key is imported as
 *           non-extractable and never logged.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 6); RFC 7519 (JWT); RFC 7515 (JWS compact form); RFC 7518 (algorithms);
 *                     owner D10 2026-10-28 (stackra-223): `expiresIn` is a `Duration`.
 */
import { Duration } from "@stackra/contracts";

import type { AuthType } from "#core/enums/auth-type.enum";
import { encodeBase64 } from "#core/functions/encode-base64.function";
import type { AuthOptions } from "#core/types/auth-options.type";

/** What a JWT is signed from: the `auth` options of a JWT integration, or the same fields of a JWT bearer one. */
type JwtOptions = Pick<
  Extract<AuthOptions, { readonly type: typeof AuthType.Jwt }>,
  "algorithm" | "key" | "keyId" | "issuer" | "subject" | "audience" | "expiresIn"
>;

/** The Web Crypto import and sign parameters of each algorithm. */
const ALGORITHMS = {
  HS256: { format: "raw", import: { name: "HMAC", hash: "SHA-256" }, sign: { name: "HMAC" } },
  RS256: {
    format: "pkcs8",
    import: { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    sign: { name: "RSASSA-PKCS1-v1_5" },
  },
  ES256: {
    format: "pkcs8",
    import: { name: "ECDSA", namedCurve: "P-256" },
    sign: { name: "ECDSA", hash: "SHA-256" },
  },
} as const;

/** The DER bytes of a PEM block. */
function derOf(pem: string): Uint8Array<ArrayBuffer> {
  const binary = atob(pem.replace(/-----(?:BEGIN|END) [A-Z ]+-----/g, "").replace(/\s+/g, ""));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

/**
 * A signed JWT for one call.
 *
 * @param resolve - fills the placeholders of the key and the claims.
 * @param now - the issue time; the token expires `expiresIn` (5 minutes by default) after it.
 * @param extra - claims added as they are (`{ scope: "a b" }`); the declared ones win.
 * @example
 * headers.set("authorization", `Bearer ${await signJwt(auth, resolve, clock.now())}`);
 */
export async function signJwt(
  auth: JwtOptions,
  resolve: (template: string) => string,
  now: Date,
  extra: Readonly<Record<string, string>> = {},
): Promise<string> {
  const algorithm = ALGORITHMS[auth.algorithm];
  const issuedAt = Math.floor(now.getTime() / 1000);
  const header = {
    alg: auth.algorithm,
    typ: "JWT",
    ...(auth.keyId === undefined ? {} : { kid: resolve(auth.keyId) }),
  };
  const claims = {
    ...extra,
    ...(auth.issuer === undefined ? {} : { iss: resolve(auth.issuer) }),
    ...(auth.subject === undefined ? {} : { sub: resolve(auth.subject) }),
    ...(auth.audience === undefined ? {} : { aud: resolve(auth.audience) }),
    iat: issuedAt,
    exp:
      issuedAt + Math.floor(Duration.toMilliseconds(auth.expiresIn ?? Duration.minutes(5)) / 1000),
  };
  const input = `${encodeBase64(JSON.stringify(header), "base64url")}.${encodeBase64(JSON.stringify(claims), "base64url")}`;
  const secret = resolve(auth.key);
  const keyData = algorithm.format === "raw" ? new TextEncoder().encode(secret) : derOf(secret);
  const key = await crypto.subtle.importKey(algorithm.format, keyData, algorithm.import, false, [
    "sign",
  ]);
  const signature = await crypto.subtle.sign(algorithm.sign, key, new TextEncoder().encode(input));
  return `${input}.${encodeBase64(new Uint8Array(signature), "base64url")}`;
}
