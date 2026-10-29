/**
 * Stackra file contract:
 * Purpose: `BearerOptions`, the shape of `BearerConfig`: the issuer (deployment data, from `STACKRA_BEARER_ISSUER`),
 *          the audience (from `STACKRA_BEARER_AUDIENCE`), the clock leeway and the key-set cache time the bearer-token
 *          guard reads.
 * Boundary: a shape class; it registers this package's own schema (`BEARER_CONFIG_SCHEMA`) when the module loads, so
 *           `buildConfig(BearerConfig)` validates with no generated file. No issuer and no audience by default, so an
 *           unconfigured guard refuses every token.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 26); ADR 0206 (decision 8).
 */
import { Int, registerSchemas, Schema } from "@stackra/validation";

import { BEARER_CONFIG_SCHEMA } from "#core/constants/bearer-config-schema.constant";

/**
 * The bearer-token settings.
 *
 * @example
 * export class BearerConfig extends BaseBearerConfig {
 *   override leewaySeconds = 30;
 * }
 */
export class BearerOptions extends Schema {
  /** Clock skew allowed on `exp` and `nbf`, in seconds (0 to 300). */
  @Int({
    min: 0,
    max: 300,
  })
  leewaySeconds = 60;

  /** How long the issuer's key set is cached, in seconds (60 to 86,400); an unknown `kid` refetches sooner. */
  @Int({
    min: 60,
    max: 86_400,
  })
  keysSeconds = 3600;

  /** The issuer URL exactly as tokens carry it in `iss` (`https://auth.figentra.com`); empty refuses every token. */
  issuer = "";

  /** The audience a token's `aud` must name (the ZITADEL project id); empty refuses every token. */
  audience = "";
}

registerSchemas([[BearerOptions, BEARER_CONFIG_SCHEMA]]);
