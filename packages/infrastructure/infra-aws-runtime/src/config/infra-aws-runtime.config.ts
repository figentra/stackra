/**
 * Stackra file contract:
 * Purpose: `InfraAwsRuntimeConfig`, the configuration of @stackra/infra-aws-runtime (key `infra_aws_runtime`): the target `AwsRuntimeHealthIndicatorDriver` probes,
 *          injected by constructor type.
 * Boundary: a configuration class over `InfraAwsRuntimeOptions` with no env map; runway's `config.infra_aws_runtime` layer sets it per
 *           environment. Loading this module registers the shipped schema, so `buildConfig` validates the class and
 *           every override.
 * Runtime: isomorphic
 * Governing contract: ADR 0402 (decision 5); ADR 0294 (decisions 19 and 20); ADR 0146 as amended.
 */
import { Config } from "@stackra/config";
import { registerSchemas } from "@stackra/validation";

import { InfraAwsRuntimeConfig$ } from "#core/constants/infra-aws-runtime-config-schema.constant";
import { InfraAwsRuntimeOptions } from "#core/schemas/infra-aws-runtime-options.schema";

// shortcut: registered here until gen writes the package's #stackra/schemas registration (registry gap G1, STA-339).
registerSchemas([[InfraAwsRuntimeOptions, InfraAwsRuntimeConfig$]]);

/**
 * The health driver's target.
 *
 * @example
 * const config = buildConfig(InfraAwsRuntimeConfig, { values: { region: "me-central-1" } });
 * new AwsRuntimeHealthIndicatorDriver(config);
 */
export class InfraAwsRuntimeConfig extends Config({ schema: InfraAwsRuntimeOptions }) {}
