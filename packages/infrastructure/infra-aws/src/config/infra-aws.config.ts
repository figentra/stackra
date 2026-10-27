/**
 * Stackra file contract:
 * Purpose: `InfraAwsConfig`, the configuration of @stackra/infra-aws (key `infra_aws`): the target `AwsHealthIndicatorDriver` probes,
 *          injected by constructor type.
 * Boundary: a configuration class over `InfraAwsOptions` with no env map; runway's `config.infra_aws` layer sets it per
 *           environment. Loading this module registers the shipped schema, so `buildConfig` validates the class and
 *           every override.
 * Runtime: isomorphic
 * Governing contract: ADR 0402 (decision 5); ADR 0294 (decisions 19 and 20); ADR 0146 as amended.
 */
import { Config } from "@stackra/config";
import { registerSchemas } from "@stackra/validation";

import { InfraAwsConfig$ } from "#core/constants/infra-aws-config-schema.constant";
import { InfraAwsOptions } from "#core/schemas/infra-aws-options.schema";

// shortcut: registered here until gen writes the package's #stackra/schemas registration (registry gap G1, STA-339).
registerSchemas([[InfraAwsOptions, InfraAwsConfig$]]);

/**
 * The health driver's target.
 *
 * @example
 * const config = buildConfig(InfraAwsConfig, { values: { region: "me-central-1" } });
 * new AwsHealthIndicatorDriver(config);
 */
export class InfraAwsConfig extends Config({ schema: InfraAwsOptions }) {}
