/**
 * Stackra file contract:
 * Purpose: `InfraObservabilityConfig`, the configuration of @stackra/infra-observability (key `infra_observability`): the target `ObservabilityHealthIndicatorDriver` probes,
 *          injected by constructor type.
 * Boundary: a configuration class over `InfraObservabilityOptions` with no env map; runway's `config.infra_observability` layer sets it per
 *           environment. Loading this module registers the shipped schema, so `buildConfig` validates the class and
 *           every override.
 * Runtime: isomorphic
 * Governing contract: ADR 0402 (decision 5); ADR 0294 (decisions 19 and 20); ADR 0146 as amended.
 */
import { Config } from "@stackra/config";
import { registerSchemas } from "@stackra/validation";

import { InfraObservabilityConfig$ } from "#core/constants/infra-observability-config-schema.constant";
import { InfraObservabilityOptions } from "#core/schemas/infra-observability-options.schema";

// shortcut: registered here until gen writes the package's #stackra/schemas registration (registry gap G1, STA-339).
registerSchemas([[InfraObservabilityOptions, InfraObservabilityConfig$]]);

/**
 * The health driver's target.
 *
 * @example
 * const config = buildConfig(InfraObservabilityConfig, { values: { url: "https://otel.acme.example/v1/logs" } });
 * new ObservabilityHealthIndicatorDriver(config);
 */
export class InfraObservabilityConfig extends Config({ schema: InfraObservabilityOptions }) {}
