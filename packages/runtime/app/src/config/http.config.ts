/**
 * Stackra file contract:
 * Purpose: `HttpConfig`, the HTTP adapter configuration (key `app.http`): the largest request body a generated adapter
 *          reads before any guard runs.
 * Boundary: a configuration class over `HttpOptions` with no env map. A host overrides it as
 *           `class HttpConfig extends BaseHttpConfig` with `override` members only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0146 as amended; ADR 0237 (STA-2577 note).
 */
import { Config } from "@stackra/config";

import { HttpOptions } from "#core/schemas/http-options.schema";

/**
 * The HTTP adapter configuration.
 *
 * @example
 * import { HttpConfig as BaseHttpConfig } from "@stackra/app/server";
 *
 * export class HttpConfig extends BaseHttpConfig {
 *   override maxBodyBytes = 5_242_880;
 * }
 */
export class HttpConfig extends Config({ schema: HttpOptions }) {}
