/**
 * Stackra file contract:
 * Purpose: `verifyGithubToken`: the verified claims of a GitHub Actions ID token.
 * Boundary: verification only; minting the publish token is `exchangeToken`'s. Throws `OidcError` with a reason that
 *           names no token value.
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 3 and 6).
 */
import { fromBase64 } from "#src/bytes/from-base64";
import type { GithubClaims } from "#src/interfaces/github-claims.interface";
import type { KeySource } from "#src/interfaces/key-source.type";
import { OidcError } from "#src/oidc/oidc-error";

/** Allowed clock skew, in seconds, on `exp` and `nbf`. */
const SKEW = 60;

/** A JWT segment as JSON. */
const segment = <T>(part: string | undefined): T => {
  if (part === undefined) throw new OidcError("token is not a JWT");
  try {
    return JSON.parse(new TextDecoder().decode(fromBase64(part))) as T;
  } catch {
    throw new OidcError("token is not a JWT");
  }
};

/**
 * The verified claims of a GitHub Actions ID token.
 *
 * @param token - the compact JWT.
 * @param options - the expected issuer and audience, the clock and the key source.
 * @throws OidcError when the signature, issuer, audience or time is wrong.
 * @example
 * const claims = await verifyGithubToken(jwt, { issuer, audience: "npm:npm.stackra.figentra.com", now, keys });
 */
export async function verifyGithubToken(
  token: string,
  options: {
    readonly issuer: string;
    readonly audience: string;
    readonly now: Date;
    readonly keys: KeySource;
  },
): Promise<GithubClaims> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new OidcError("token is not a JWT");
  const header = segment<{ alg?: string; kid?: string }>(parts[0]);
  if (header.alg !== "RS256" || header.kid === undefined)
    throw new OidcError("token must be RS256 with a kid");
  const jwk = await options.keys(header.kid);
  if (jwk === null) throw new OidcError("token key is unknown");
  const algorithm = { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" } as const;
  const key = await crypto.subtle.importKey("jwk", jwk, algorithm, false, ["verify"]);
  const valid = await crypto.subtle.verify(
    algorithm,
    key,
    fromBase64(parts[2] ?? ""),
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
  );
  if (!valid) throw new OidcError("token signature is invalid");
  const claims = segment<GithubClaims>(parts[1]);
  const seconds = Math.floor(options.now.getTime() / 1000);
  if (claims.iss !== options.issuer) throw new OidcError("token issuer is wrong");
  const audiences = typeof claims.aud === "string" ? [claims.aud] : claims.aud;
  if (!Array.isArray(audiences) || !audiences.includes(options.audience))
    throw new OidcError("token audience is wrong");
  if (typeof claims.exp !== "number" || claims.exp + SKEW <= seconds)
    throw new OidcError("token has expired");
  if (claims.nbf !== undefined && claims.nbf - SKEW > seconds)
    throw new OidcError("token is not valid yet");
  return claims;
}
