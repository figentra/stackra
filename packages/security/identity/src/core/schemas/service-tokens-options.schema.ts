/**
 * Stackra file contract:
 * Purpose: `ServiceTokensOptions`, the shape of `ServiceTokensConfig`: the issuer this service signs in at, the name of
 *          the secret that holds its service account's key, how long before expiry a token is renewed, and how long one
 *          token request may take.
 * Boundary: a shape class; it registers this package's own schema (`SERVICE_TOKENS_CONFIG_SCHEMA`) when the module
 *           loads. The key itself is read from the secret store by that name when a token is needed, never kept here.
 *           Server only: never part of a browser build.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 26); ADR 0173; ADR 0209 (decision 3).
 */
import { Int, registerSchemas, Schema } from "@stackra/validation";

import { SERVICE_TOKENS_CONFIG_SCHEMA } from "#core/constants/service-tokens-config-schema.constant";

/**
 * The service token settings.
 *
 * @example
 * export class ServiceTokensConfig extends BaseServiceTokensConfig {
 *   override issuer = "https://id.stackra.app";
 * }
 */
export class ServiceTokensOptions extends Schema {
  /** Seconds before a token's expiry at which it is renewed instead of reused. */
  @Int({
    min: 0,
    max: 3600,
  })
  skewSeconds = 60;

  /** Seconds one token request may take before it counts as unavailable. */
  @Int({
    min: 1,
    max: 120,
  })
  timeoutSeconds = 10;

  /** The issuer's base URL (`https://id.stackra.app`), the same as the bearer issuer; empty until runway sets it. */
  issuer = "";

  /** The name of the secret holding the service account's ZITADEL key file (JSON), read from the secret store. */
  keySecret = "IDENTITY_SERVICE_ACCOUNT_KEY";
}

registerSchemas([[ServiceTokensOptions, SERVICE_TOKENS_CONFIG_SCHEMA]]);
