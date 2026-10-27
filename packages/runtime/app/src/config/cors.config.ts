/**
 * Stackra file contract:
 * Purpose: `CorsConfig`, the CORS configuration (key `app.cors`): allowed origins, methods, request headers,
 *          credentials and preflight max-age, read by `corsHeaders` and, for the origins, by `OriginGuard`.
 * Boundary: a configuration class over `CorsOptions`; the origins come from `STACKRA_CORS_ALLOWED_ORIGINS` (a JSON
 *           array) or runway, since they are deployment data. A host overrides it as
 *           `class CorsConfig extends BaseCorsConfig` with `override` members only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0146 as amended; ADR 0437.
 */
import { Config } from "@stackra/config";

import { CorsOptions } from "#core/schemas/cors-options.schema";

/**
 * The CORS configuration.
 *
 * @example
 * import { CorsConfig as BaseCorsConfig } from "@stackra/app/server";
 *
 * export class CorsConfig extends BaseCorsConfig {
 *   override maxAgeSeconds = 3600;
 * }
 */
export class CorsConfig extends Config({
  schema: CorsOptions,
  env: { allowedOrigins: "STACKRA_CORS_ALLOWED_ORIGINS" },
}) {}
