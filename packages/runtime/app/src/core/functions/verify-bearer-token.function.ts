/**
 * Stackra file contract:
 * Purpose: `verifyBearerToken`, the claims of a JWT access token (ZITADEL's, or any OIDC issuer's) whose signature
 *          one of the issuer's published keys accepts, whose `iss` is the issuer, whose `aud` names the audience and
 *          whose `exp` and `nbf` hold within the leeway; otherwise undefined.
 * Boundary: Web Crypto only (`crypto.subtle`), so the API's bearer-token guard and the edge Worker share it. Accepts
 *           RS256 and ES256 only: `none`, every HS* and any other algorithm is refused, and so is a key whose `kty` or
 *           `alg` does not fit the header's algorithm (no algorithm confusion). Never throws on an untrusted token; a
 *           key source that cannot reach the issuer throws, since an outage is not a bad token.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decision 8: tokens verified by JWKS); RFC 7515; RFC 7519; RFC 8725 (JWT best practices).
 */
import type { JsonWebKeys } from "#contracts/ports/json-web-keys.port";

/** The Web Crypto parameters and key type of each accepted JWS algorithm. */
const ALGORITHMS: Readonly<
  Record<
    string,
    {
      readonly kty: string;
      readonly import: RsaHashedImportParams | EcKeyImportParams;
      readonly verify: AlgorithmIdentifier | EcdsaParams;
    }
  >
> = {
  RS256: {
    kty: "RSA",
    import: { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    verify: { name: "RSASSA-PKCS1-v1_5" },
  },
  // A JWS ES256 signature is the raw r || s pair, the form Web Crypto verifies.
  ES256: {
    kty: "EC",
    import: { name: "ECDSA", namedCurve: "P-256" },
    verify: { name: "ECDSA", hash: "SHA-256" },
  },
};

/** The bytes of a base64url segment, or null. */
const bytesOf = (segment: string): Uint8Array<ArrayBuffer> | null => {
  try {
    return Uint8Array.from(atob(segment.replaceAll("-", "+").replaceAll("_", "/")), (char) =>
      // oxlint-disable-next-line unicorn/prefer-code-point -- a binary string: every character is one byte
      char.charCodeAt(0),
    );
  } catch {
    return null;
  }
};

/** A segment as a JSON object, or null. */
const objectOf = (segment: string): Readonly<Record<string, unknown>> | null => {
  const bytes = bytesOf(segment);
  if (bytes === null) return null;
  try {
    const value: unknown = JSON.parse(new TextDecoder().decode(bytes));
    return typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Readonly<Record<string, unknown>>)
      : null;
  } catch {
    return null;
  }
};

/**
 * The verified claims of `token`, or undefined when it is not a valid token for this issuer and audience.
 *
 * @param token - the compact JWT, without the `Bearer ` prefix.
 * @param options - the expected issuer and audience, the clock leeway in seconds, now, and the key source.
 * @throws Error only when the key source cannot reach the issuer.
 * @example
 * const claims = await verifyBearerToken(jwt, { issuer, audience, leewaySeconds: 60, now: new Date(), keys });
 * if (claims === undefined) throw BearerTokenInvalidError.create();
 */
export async function verifyBearerToken(
  token: string,
  options: {
    readonly issuer: string;
    readonly audience: string;
    readonly leewaySeconds: number;
    readonly now: Date;
    readonly keys: JsonWebKeys["find"];
  },
): Promise<Readonly<Record<string, unknown>> | undefined> {
  const parts = token.split(".");
  if (parts.length !== 3 || options.issuer === "" || options.audience === "") return undefined;
  const [head = "", body = "", signed = ""] = parts;
  const header = objectOf(head);
  const alg = header?.["alg"];
  const kid = header?.["kid"];
  const algorithm =
    typeof alg === "string" && Object.hasOwn(ALGORITHMS, alg) ? ALGORITHMS[alg] : undefined;
  if (algorithm === undefined || typeof kid !== "string") return undefined;
  const jwk = await options.keys(kid);
  if (jwk === null || jwk.kty !== algorithm.kty || (jwk.alg !== undefined && jwk.alg !== alg))
    return undefined;
  const signature = bytesOf(signed);
  if (signature === null) return undefined;
  const valid = await crypto.subtle
    .importKey("jwk", jwk, algorithm.import, false, ["verify"])
    .then((key) =>
      crypto.subtle.verify(
        algorithm.verify,
        key,
        signature,
        new TextEncoder().encode(`${head}.${body}`),
      ),
    )
    .catch(() => false);
  if (!valid) return undefined;
  const claims = objectOf(body);
  if (claims === null || claims["iss"] !== options.issuer) return undefined;
  const aud = claims["aud"];
  const audiences = typeof aud === "string" ? [aud] : Array.isArray(aud) ? aud : [];
  if (!audiences.includes(options.audience)) return undefined;
  const seconds = Math.floor(options.now.getTime() / 1000);
  const { exp, nbf } = claims;
  if (typeof exp !== "number" || exp + options.leewaySeconds <= seconds) return undefined;
  if (nbf !== undefined && (typeof nbf !== "number" || nbf - options.leewaySeconds > seconds))
    return undefined;
  return claims;
}
