/**
 * Stackra file contract:
 * Purpose: `CsrfOptions`, the shape of `CsrfConfig`: the state-changing methods `CsrfGuard` and `OriginGuard`
 *          protect, the header a cookie-authenticated call must carry, and the double-submit cookie.
 * Boundary: a shape class; it registers this package's own schema (`CSRF_CONFIG_SCHEMA`) when the module loads. An
 *           empty `tokenCookie` is custom-header mode, which fits the cross-origin BFF (the app cannot read the API
 *           origin's cookie); a same-origin deployment sets it to turn on double-submit.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 26); ADR 0437 (server-check order).
 */
import { registerSchemas, Schema } from "@stackra/validation";

import { CSRF_CONFIG_SCHEMA } from "#core/constants/csrf-config-schema.constant";

/**
 * The CSRF settings.
 *
 * @example
 * export class CsrfConfig extends BaseCsrfConfig {
 *   override tokenCookie = "__Host-csrf";
 * }
 */
export class CsrfOptions extends Schema {
  /** Methods that change state, upper case; every other method passes both guards. */
  protectedMethods: string[] = ["POST", "PUT", "PATCH", "DELETE"];

  /** The request header a cookie-authenticated call must carry, lower case. */
  headerName = "x-stackra-csrf";

  /** The cookie the header must repeat (double-submit); empty for custom-header mode. */
  tokenCookie = "";
}

registerSchemas([[CsrfOptions, CSRF_CONFIG_SCHEMA]]);
