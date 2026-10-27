/**
 * Stackra file contract:
 * Purpose: `InfraGithubConfig`, the configuration of @stackra/infra-github (key `infra_github`): the target `GithubHealthIndicatorDriver` probes,
 *          injected by constructor type.
 * Boundary: a configuration class over `InfraGithubOptions` with no env map; runway's `config.infra_github` layer sets it per
 *           environment. Loading this module registers the shipped schema, so `buildConfig` validates the class and
 *           every override.
 * Runtime: isomorphic
 * Governing contract: ADR 0402 (decision 5); ADR 0294 (decisions 19 and 20); ADR 0146 as amended.
 */
import { Config } from "@stackra/config";
import { registerSchemas } from "@stackra/validation";

import { InfraGithubConfig$ } from "#core/constants/infra-github-config-schema.constant";
import { InfraGithubOptions } from "#core/schemas/infra-github-options.schema";

// shortcut: registered here until gen writes the package's #stackra/schemas registration (registry gap G1, STA-339).
registerSchemas([[InfraGithubOptions, InfraGithubConfig$]]);

/**
 * The health driver's target.
 *
 * @example
 * const config = buildConfig(InfraGithubConfig, { values: { api: "https://api.github.com/" } });
 * new GithubHealthIndicatorDriver(config);
 */
export class InfraGithubConfig extends Config({ schema: InfraGithubOptions }) {}
