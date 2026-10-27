/**
 * Stackra file contract:
 * Purpose: `InfraGcpConfig`, the configuration of @stackra/infra-gcp (key `infra_gcp`): the target `GcpHealthIndicatorDriver` probes,
 *          injected by constructor type.
 * Boundary: a configuration class over `InfraGcpOptions` with no env map; runway's `config.infra_gcp` layer sets it per
 *           environment. Loading this module registers the shipped schema, so `buildConfig` validates the class and
 *           every override.
 * Runtime: isomorphic
 * Governing contract: ADR 0402 (decision 5); ADR 0294 (decisions 19 and 20); ADR 0146 as amended.
 */
import { Config } from "@stackra/config";
import { registerSchemas } from "@stackra/validation";

import { InfraGcpConfig$ } from "#core/constants/infra-gcp-config-schema.constant";
import { InfraGcpOptions } from "#core/schemas/infra-gcp-options.schema";

// shortcut: registered here until gen writes the package's #stackra/schemas registration (registry gap G1, STA-339).
registerSchemas([[InfraGcpOptions, InfraGcpConfig$]]);

/**
 * The health driver's target.
 *
 * @example
 * const config = buildConfig(InfraGcpConfig, { values: { region: "me-central2" } });
 * new GcpHealthIndicatorDriver(config);
 */
export class InfraGcpConfig extends Config({ schema: InfraGcpOptions }) {}
