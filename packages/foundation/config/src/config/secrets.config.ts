/**
 * Stackra file contract:
 * Purpose: `SecretsConfig`, the configuration that picks this package's `SecretStore` driver (key `config.secrets`).
 * Boundary: a configuration class over `SecretsOptions` with no env map; runway's layer sets it per environment.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0146 as amended; ADR 0173.
 */
import { Config } from "#core/bases/config.base";
import { SecretsOptions } from "#core/schemas/secrets-options.schema";

/**
 * The secret store's configuration.
 *
 * @example
 * const config = buildConfig(SecretsConfig, { values: { store: "aws_secrets_manager" } });
 */
export class SecretsConfig extends Config({ schema: SecretsOptions }) {}
