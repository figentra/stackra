/**
 * Stackra file contract:
 * Purpose: `CorsOptions`, the shape of `CorsConfig`: the allowed origins (deployment data, from
 *          `STACKRA_CORS_ALLOWED_ORIGINS`), the methods and request headers a preflight allows, credentials and the
 *          preflight cache time. `OriginGuard` shares the origin list.
 * Boundary: a shape class; it registers this package's own schema (`CORS_CONFIG_SCHEMA`) when the module loads, so
 *           `buildConfig(CorsConfig)` validates with no generated file. No origin is allowed by default: a
 *           deployment lists its app origins.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 26); ADR 0437 (server-check order).
 */
import { Int, registerSchemas, Schema } from "@stackra/validation";

import { CORS_CONFIG_SCHEMA } from "#core/constants/cors-config-schema.constant";

/**
 * The CORS settings.
 *
 * @example
 * export class CorsConfig extends BaseCorsConfig {
 *   override allowedOrigins = ["https://app.acme.example"];
 * }
 */
export class CorsOptions extends Schema {
  /** How long a browser caches a preflight answer, in seconds (0 to 86,400). */
  @Int({
    min: 0,
    max: 86_400,
  })
  maxAgeSeconds = 600;

  /** Exact origins (`https://app.acme.example`) a browser may call from; no wildcard. */
  allowedOrigins: string[] = [];

  /** Methods a preflight allows, upper case. */
  allowedMethods: string[] = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"];

  /** Request headers a preflight allows, lower case; keep `CsrfConfig.headerName` here. */
  allowedHeaders: string[] = ["content-type", "authorization", "x-stackra-csrf"];

  /** Let the BFF cookie travel (`Access-Control-Allow-Credentials: true`). */
  allowCredentials = true;
}

registerSchemas([[CorsOptions, CORS_CONFIG_SCHEMA]]);
