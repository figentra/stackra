/**
 * Stackra file contract:
 * Purpose: `mintDevToken`, a dev access token (STA-2795): a compact ES256 JWT signed with the dev issuer's private
 *          key, issued by `DEV_ISSUER.issuer` for `DEV_ISSUER.audience`, whose subject is the user and whose claims are
 *          the provider-neutral `IDENTITY_CLAIMS` a ZITADEL token carries, so the API maps it to its actor exactly as
 *          it maps a real one. `stackra dev token` prints one.
 * Boundary: Web Crypto only. It signs whatever it is handed; only a service run by `stackra dev` (`devIssuerKeys`:
 *           `STACKRA_ENVIRONMENT=dev` with the public key set) accepts the result, and every deployed environment
 *           refuses it. Refuses (TypeError) a user id that is not a `usr_` public id, a ttl outside 1 to 86,400
 *           seconds, and a key that is not an ES256 private JWK with a `kid`.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decisions 2, 3 and 8; amendment of 2026-11-26: the dev issuer); RFC 7515; RFC 7519.
 */
import { IDENTITY_CLAIMS } from "@stackra/identity";
import { publicId } from "@stackra/validation";

import { DEV_ISSUER } from "#core/constants/dev-issuer.constant";
import type { DevTokenClaims } from "#core/types/dev-token-claims.type";

/** One hour, the default lifetime. */
const DEFAULT_TTL_SECONDS = 3600;

/** One day, the longest lifetime. */
const MAX_TTL_SECONDS = 86_400;

/** The base64url text of `bytes`. */
const base64url = (bytes: Uint8Array): string =>
  btoa(String.fromCodePoint(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");

/** The base64url segment of a JSON value. */
const segment = (value: object): string =>
  base64url(new TextEncoder().encode(JSON.stringify(value)));

/**
 * A dev token for `claims`, signed with `privateKey`.
 *
 * @param privateKey - the dev issuer's private JWK (ES256, with its `kid`).
 * @param claims - the caller the token names and how long it lives.
 * @throws TypeError when the user id, the ttl or the key is not acceptable.
 * @example
 * const token = await mintDevToken(key.privateKey, { userId: "usr_01j9z3k4m5n6p7q8r9s0t1v2w3", realm: Realm.Staff });
 * await fetch(url, { headers: { authorization: `Bearer ${token}` } });
 */
export async function mintDevToken(
  privateKey: JsonWebKey & { readonly kid: string },
  claims: DevTokenClaims,
): Promise<string> {
  if (!publicId("usr").safeParse(claims.userId).success)
    throw new TypeError("a dev token's user id is a usr_ public id");
  const ttl = claims.ttlSeconds ?? DEFAULT_TTL_SECONDS;
  if (!Number.isInteger(ttl) || ttl < 1 || ttl > MAX_TTL_SECONDS)
    throw new TypeError(`a dev token lives 1 to ${MAX_TTL_SECONDS} seconds`);
  if (privateKey.kty !== "EC" || privateKey.crv !== "P-256" || privateKey.d === undefined)
    throw new TypeError("the dev issuer key is an ES256 private JWK");
  const issuedAt = Math.floor((claims.now ?? new Date()).getTime() / 1000);
  const payload = {
    iss: DEV_ISSUER.issuer,
    aud: DEV_ISSUER.audience,
    sub: claims.userId,
    iat: issuedAt,
    nbf: issuedAt,
    exp: issuedAt + ttl,
    [IDENTITY_CLAIMS.userId]: claims.userId,
    [IDENTITY_CLAIMS.realm]: claims.realm,
    ...(claims.scopePath === undefined ? {} : { [IDENTITY_CLAIMS.scopePath]: claims.scopePath }),
    ...(claims.memberships === undefined
      ? {}
      : { [IDENTITY_CLAIMS.memberships]: claims.memberships }),
    ...(claims.permissions === undefined
      ? {}
      : { [IDENTITY_CLAIMS.permissions]: claims.permissions }),
    ...(claims.email === undefined ? {} : { email: claims.email }),
    ...(claims.name === undefined ? {} : { name: claims.name }),
  };
  const signing = `${segment({ alg: DEV_ISSUER.algorithm, typ: "JWT", kid: privateKey.kid })}.${segment(payload)}`;
  const key = await crypto.subtle.importKey(
    "jwk",
    privateKey,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  // Web Crypto's ECDSA signature is the raw r || s pair, the form JWS ES256 carries.
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(signing),
  );
  return `${signing}.${base64url(new Uint8Array(signature))}`;
}
