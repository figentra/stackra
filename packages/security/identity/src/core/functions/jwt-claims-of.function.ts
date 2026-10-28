/**
 * Stackra file contract:
 * Purpose: `jwtClaimsOf(token)`, the claims of a JWT's payload, decoded as UTF-8 JSON.
 * Boundary: internal; decodes and verifies nothing. The PKCE driver calls it only on an ID token it received straight
 *           from the token endpoint over TLS, which OpenID Connect Core 3.1.3.7 accepts in place of the signature, and
 *           then checks the issuer, the audience, the expiry and the nonce itself. A malformed token is refused.
 * Runtime: isomorphic
 * Governing contract: RFC 7519; OpenID Connect Core (section 3.1.3.7); ADR 0206 (decision 8).
 */
import { UnauthenticatedError } from "@stackra/errors";

/**
 * The payload of `token`.
 *
 * @throws UnauthenticatedError when `token` is not three dot-separated parts whose middle one is a JSON object.
 * @example
 * const claims = jwtClaimsOf(answer.id_token);
 * if (claims.nonce !== nonce) throw UnauthenticatedError.create();
 */
export function jwtClaimsOf(token: string): Readonly<Record<string, unknown>> {
  const parts = token.split(".");
  const payload = parts.length === 3 ? parts[1] : undefined;
  if (payload === undefined) throw UnauthenticatedError.create();
  let claims: unknown;
  try {
    const binary = atob(payload.replaceAll("-", "+").replaceAll("_", "/"));
    // Percent-encoding each byte lets decodeURIComponent read UTF-8 on every runtime, TextDecoder or not.
    const text = decodeURIComponent(
      // oxlint-disable-next-line unicorn/prefer-code-point -- a binary string: every character is one byte, so the code unit is the byte
      Array.from(binary, (char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`).join(""),
    );
    claims = JSON.parse(text);
  } catch (error) {
    throw UnauthenticatedError.create({}, { cause: error });
  }
  if (typeof claims !== "object" || claims === null || Array.isArray(claims))
    throw UnauthenticatedError.create();
  return claims as Readonly<Record<string, unknown>>;
}
