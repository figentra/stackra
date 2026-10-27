/**
 * Stackra file contract:
 * Purpose: `OriginGuard`, the second check of ADR 0437's server-check order: a `RequestGuard` that lets a
 *          state-changing request (`CsrfConfig.protectedMethods`) through only from the API's own origin or one of
 *          `CorsConfig.allowedOrigins`, read from `Origin`, else from `Referer`. A request with a cookie and neither
 *          header is refused; one with no cookie and no origin (a server-to-server or API-key call) passes.
 * Boundary: stateless; every value is configuration (`CorsConfig`, `CsrfConfig`). Every failure is one
 *           `OriginNotAllowedError`. Safe methods pass: reading cross-origin is stopped by CORS, not here.
 * Runtime: node
 * Governing contract: ADR 0437 (decision 8: origin after the edge headers); ADR 0457 (RequestGuard); ADR 0306.
 */
import type { CorsConfig } from "#config/cors.config";
import type { CsrfConfig } from "#config/csrf.config";
import { RequestGuard } from "#server/bases/request-guard.base";
import { OriginNotAllowedError } from "#server/errors/origin-not-allowed.error";
import { isAllowedOrigin } from "#server/functions/is-allowed-origin.function";
import { originOf } from "#server/functions/origin-of.function";

/**
 * Checks the origin of every state-changing request.
 *
 * @example
 * // allowed: STACKRA_CORS_ALLOWED_ORIGINS='["https://app.acme.example"]'
 * await guard.check(new Request("https://api.acme.example/x", { method: "POST", headers: { origin } }));
 */
export class OriginGuard extends RequestGuard {
  /** The allowed origins. */
  private readonly cors: CorsConfig;

  /** The protected methods. */
  private readonly csrf: CsrfConfig;

  /**
   * @param cors - the allowed origins.
   * @param csrf - the methods that change state.
   */
  constructor(cors: CorsConfig, csrf: CsrfConfig) {
    super();
    this.cors = cors;
    this.csrf = csrf;
  }

  /** After the edge headers, before CSRF, rate limits and authentication. */
  override get order(): number {
    return -90;
  }

  /**
   * Lets `request` through when its origin is allowed.
   *
   * @throws OriginNotAllowedError when a state-changing request comes from another origin, or has a cookie and none.
   */
  check(request: Request): void {
    if (!this.csrf.protectedMethods.includes(request.method.toUpperCase())) return;
    const referer = request.headers.get("referer");
    const origin =
      request.headers.get("origin") ?? (referer === null ? undefined : originOf(referer));
    if (origin === undefined) {
      if (request.headers.has("cookie")) throw OriginNotAllowedError.create();
      return;
    }
    const allowed = [new URL(request.url).origin, ...this.cors.allowedOrigins];
    if (!isAllowedOrigin(origin, allowed)) throw OriginNotAllowedError.create();
  }
}
