/**
 * Stackra file contract:
 * Purpose: `BearerConfig`, the bearer-token configuration (key `app.bearer`): the issuer and audience an access token
 *          must carry, the clock leeway and the key-set cache time, read by `BearerTokenGuard` and the `oidc`
 *          `JsonWebKeys` driver.
 * Boundary: a configuration class over `BearerOptions`; the issuer and audience come from `STACKRA_BEARER_ISSUER` and
 *           `STACKRA_BEARER_AUDIENCE` or runway, since they are deployment data (public values, never a secret). A host
 *           overrides it as `class BearerConfig extends BaseBearerConfig` with `override` members only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0306; ADR 0206 (decision 8).
 */
import { Config } from "@stackra/config";

import { BearerOptions } from "#core/schemas/bearer-options.schema";

/**
 * The bearer-token configuration.
 *
 * @example
 * import { BearerConfig as BaseBearerConfig } from "@stackra/app/server";
 *
 * export class BearerConfig extends BaseBearerConfig {
 *   override leewaySeconds = 30;
 * }
 */
export class BearerConfig extends Config({
  schema: BearerOptions,
  env: { issuer: "STACKRA_BEARER_ISSUER", audience: "STACKRA_BEARER_AUDIENCE" },
}) {}
