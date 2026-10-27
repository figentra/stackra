/**
 * Stackra file contract:
 * Purpose: `corsHeaders`, the CORS answer headers for one request under `CorsConfig`: on an allowed origin, the
 *          origin echoed, credentials when on, and, for a preflight (`OPTIONS` with
 *          `Access-Control-Request-Method`), the allowed methods, request headers and max-age.
 * Boundary: pure; it answers headers, never a `Response`, so the generated adapter adds them to every answer and
 *           answers a preflight with 204 and them. A disallowed origin, or a preflight for a method not allowed, gets
 *           only `Vary: Origin`, so the browser blocks it. Refusing the request itself is `OriginGuard`'s job.
 * Runtime: node
 * Governing contract: ADR 0437 (server-check order); Fetch standard (CORS protocol).
 */
import type { CorsConfig } from "#config/cors.config";
import { isAllowedOrigin } from "#server/functions/is-allowed-origin.function";

/**
 * The CORS headers to answer `request` with.
 *
 * @example
 * if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request, cors) });
 */
export function corsHeaders(request: Request, config: CorsConfig): Headers {
  const headers = new Headers({ vary: "Origin" });
  const origin = request.headers.get("origin");
  if (origin === null || !isAllowedOrigin(origin, config.allowedOrigins)) return headers;
  const requested = request.headers.get("access-control-request-method");
  const isPreflight = request.method === "OPTIONS" && requested !== null;
  if (isPreflight && !config.allowedMethods.includes(requested.toUpperCase())) return headers;
  headers.set("access-control-allow-origin", origin);
  if (config.allowCredentials) headers.set("access-control-allow-credentials", "true");
  if (isPreflight) {
    headers.set("access-control-allow-methods", config.allowedMethods.join(", "));
    headers.set("access-control-allow-headers", config.allowedHeaders.join(", "));
    headers.set("access-control-max-age", String(config.maxAgeSeconds));
  }
  return headers;
}
