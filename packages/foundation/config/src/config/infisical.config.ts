/**
 * Stackra file contract:
 * Purpose: `InfisicalConfig`, the configuration of the Infisical secret store (key `config.infisical`): the instance,
 *          project, environment and folder, and the machine identity's credentials by secret name.
 * Boundary: a configuration class over `InfisicalOptions` with no env map; runway's `config.config.infisical` layer
 *           sets the instance per environment, and the two credentials come from the platform's secret store when it
 *           is built. A host overrides it as `class InfisicalConfig extends BaseInfisicalConfig`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0146 as amended; ADR 0173.
 */
import { Config } from "#core/bases/config.base";
import { InfisicalOptions } from "#core/schemas/infisical-options.schema";

/**
 * The Infisical secret store's configuration.
 *
 * @example
 * const config = buildConfig(InfisicalConfig, { values, secrets: platformSecrets });
 */
export class InfisicalConfig extends Config({ schema: InfisicalOptions }) {}
