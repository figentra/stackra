/**
 * Stackra file contract:
 * Purpose: `bearerToken`, the middleware that sends the caller's access token as `Authorization: Bearer <token>`.
 * Boundary: asks the token source once per request and keeps nothing; no token (signed out) sends the request as it
 *           is, and an `Authorization` header already on the request wins. The browser console signs in through the
 *           BFF cookie and does not use it; API clients, mobile and desktop do.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (identity provider tokens); ADR 0082 (API areas and auth).
 */
import { TRANSPORT_HEADERS } from "#core/constants/transport-headers.constant";
import { withHeader } from "#core/functions/with-header.function";
import type { Middleware } from "#core/types/middleware.type";
import type { TokenSource } from "#core/types/token-source.type";

/**
 * Adds the bearer token.
 *
 * @example
 * createTransport({ middleware: [bearerToken(() => session.accessToken)] });
 */
export function bearerToken(token: TokenSource): Middleware {
  return async (request, next) => {
    if (request.headers.has(TRANSPORT_HEADERS.authorization)) return next(request);
    const value = await token();
    if (value === undefined || value === "") return next(request);
    return next(withHeader(request, TRANSPORT_HEADERS.authorization, `Bearer ${value}`));
  };
}
