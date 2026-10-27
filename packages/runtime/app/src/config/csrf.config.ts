/**
 * Stackra file contract:
 * Purpose: `CsrfConfig`, the CSRF configuration (key `app.csrf`): the protected methods, the CSRF header and the
 *          double-submit cookie, read by `CsrfGuard` and (the methods) `OriginGuard`.
 * Boundary: a configuration class over `CsrfOptions` with no env map. A host overrides it as
 *           `class CsrfConfig extends BaseCsrfConfig` with `override` members only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0146 as amended; ADR 0437.
 */
import { Config } from "@stackra/config";

import { CsrfOptions } from "#core/schemas/csrf-options.schema";

/**
 * The CSRF configuration.
 *
 * @example
 * import { CsrfConfig as BaseCsrfConfig } from "@stackra/app/server";
 *
 * export class CsrfConfig extends BaseCsrfConfig {
 *   override tokenCookie = "__Host-csrf";
 * }
 */
export class CsrfConfig extends Config({ schema: CsrfOptions }) {}
