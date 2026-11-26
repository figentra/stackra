/**
 * Stackra file contract:
 * Purpose: `HttpOptions`, the shape of `HttpConfig`: the largest request body, in bytes, a generated HTTP adapter
 *          reads before any guard runs; a larger one is answered 413.
 * Boundary: a shape class; it registers this package's own schema (`HTTP_CONFIG_SCHEMA`) when the module loads.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 26); ADR 0237 (STA-2577 note: raw adapters).
 */
import { Int, registerSchemas, Schema } from "@stackra/validation";

import { HTTP_CONFIG_SCHEMA } from "#core/constants/http-config-schema.constant";

/**
 * The HTTP adapter settings.
 *
 * @example
 * export class HttpConfig extends BaseHttpConfig {
 *   override maxBodyBytes = 5_242_880;
 * }
 */
export class HttpOptions extends Schema {
  /** The largest request body read, in bytes (1 to 100 MiB; 1 MiB by default). */
  @Int({
    min: 1,
    max: 104_857_600,
  })
  maxBodyBytes = 1_048_576;
}

registerSchemas([[HttpOptions, HTTP_CONFIG_SCHEMA]]);
