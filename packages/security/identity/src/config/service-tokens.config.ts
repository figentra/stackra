/**
 * Stackra file contract:
 * Purpose: `ServiceTokensConfig`, the configuration of the ZITADEL service token driver (key `service_tokens`): the
 *          issuer, the name of the secret holding this service's account key, the renewal skew and the request timeout.
 * Boundary: a configuration class over `ServiceTokensOptions` with no env map; runway's `config.service_tokens` layer
 *           sets the issuer per environment, and the key is the secret this config names (by default
 *           `IDENTITY_SERVICE_ACCOUNT_KEY`), read from the secret store. Read by `ZitadelServiceTokensDriver` only;
 *           server only, exported from `./node`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0146 as amended; ADR 0173; ADR 0209 (decision 3).
 */
import { Config } from "@stackra/config";

import { ServiceTokensOptions } from "#core/schemas/service-tokens-options.schema";

/**
 * The service token configuration.
 *
 * @example
 * import { ServiceTokensConfig as BaseServiceTokensConfig } from "@stackra/identity/node";
 *
 * export class ServiceTokensConfig extends BaseServiceTokensConfig {
 *   override issuer = "https://id.stackra.app";
 * }
 */
export class ServiceTokensConfig extends Config({ schema: ServiceTokensOptions }) {}
