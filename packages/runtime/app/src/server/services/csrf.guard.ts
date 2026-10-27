/**
 * Stackra file contract:
 * Purpose: `CsrfGuard`, the third check of ADR 0437's server-check order: a `RequestGuard` that makes a
 *          cookie-authenticated, state-changing request (`CsrfConfig.protectedMethods` with a `Cookie` header) carry
 *          the `CsrfConfig.headerName` header. In custom-header mode (no `tokenCookie`, the cross-origin BFF) the
 *          header must be non-empty: a page on another origin cannot send it without a preflight that CORS refuses.
 *          With `tokenCookie` set (double-submit) the header must equal that cookie's value.
 * Boundary: stateless; every value is configuration (`CsrfConfig`). Requests without a cookie (bearer tokens, API
 *           keys) and safe methods pass. Every failure is one `CsrfTokenInvalidError`; the comparison is
 *           constant-time. The token cookie itself is set by the BFF, not here.
 * Runtime: node
 * Governing contract: ADR 0437 (decision 8: CSRF after origin); ADR 0457 (RequestGuard); ADR 0306; OWASP CSRF
 *                     prevention (custom request header, double-submit cookie).
 */
import { timingSafeEqual } from "node:crypto";

import type { CsrfConfig } from "#config/csrf.config";
import { RequestGuard } from "#server/bases/request-guard.base";
import { CsrfTokenInvalidError } from "#server/errors/csrf-token-invalid.error";

/** The value of cookie `name` in a `Cookie` header, or `undefined`. */
function cookieValue(header: string, name: string): string | undefined {
  for (const pair of header.split(";")) {
    const at = pair.indexOf("=");
    if (at > 0 && pair.slice(0, at).trim() === name) return pair.slice(at + 1).trim();
  }
  return undefined;
}

/**
 * Checks the CSRF header of every cookie-authenticated, state-changing request.
 *
 * @example
 * // the client sends `x-stackra-csrf: 1` on every fetch with credentials: "include"
 * await guard.check(request);
 */
export class CsrfGuard extends RequestGuard {
  /** The protected methods, the header and the token cookie. */
  private readonly config: CsrfConfig;

  /**
   * @param config - the CSRF settings.
   */
  constructor(config: CsrfConfig) {
    super();
    this.config = config;
  }

  /** After the origin check, before rate limits and authentication. */
  override get order(): number {
    return -80;
  }

  /**
   * Lets `request` through when it is not cookie-authenticated, not state-changing, or carries a valid CSRF header.
   *
   * @throws CsrfTokenInvalidError when the header is missing, empty or (double-submit) does not match the cookie.
   */
  check(request: Request): void {
    const cookies = request.headers.get("cookie");
    if (cookies === null || !this.config.protectedMethods.includes(request.method.toUpperCase()))
      return;
    const given = request.headers.get(this.config.headerName) ?? "";
    if (given === "") throw CsrfTokenInvalidError.create();
    if (this.config.tokenCookie === "") return;
    const expected = Buffer.from(cookieValue(cookies, this.config.tokenCookie) ?? "");
    const actual = Buffer.from(given);
    if (
      expected.length === 0 ||
      expected.length !== actual.length ||
      !timingSafeEqual(expected, actual)
    )
      throw CsrfTokenInvalidError.create();
  }
}
