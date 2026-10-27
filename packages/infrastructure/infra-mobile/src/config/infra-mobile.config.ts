/**
 * Stackra file contract:
 * Purpose: `InfraMobileConfig`, the configuration of @stackra/infra-mobile (key `infra_mobile`): the target `MobileHealthIndicatorDriver` probes,
 *          injected by constructor type.
 * Boundary: a configuration class over `InfraMobileOptions` with no env map; runway's `config.infra_mobile` layer sets it per
 *           environment. Loading this module registers the shipped schema, so `buildConfig` validates the class and
 *           every override.
 * Runtime: isomorphic
 * Governing contract: ADR 0402 (decision 5); ADR 0294 (decisions 19 and 20); ADR 0146 as amended.
 */
import { Config } from "@stackra/config";
import { registerSchemas } from "@stackra/validation";

import { InfraMobileConfig$ } from "#core/constants/infra-mobile-config-schema.constant";
import { InfraMobileOptions } from "#core/schemas/infra-mobile-options.schema";

// shortcut: registered here until gen writes the package's #stackra/schemas registration (registry gap G1, STA-339).
registerSchemas([[InfraMobileOptions, InfraMobileConfig$]]);

/**
 * The health driver's target.
 *
 * @example
 * const config = buildConfig(InfraMobileConfig, { values: { projectId: "0b1c2d3e-4f50-6172-8394-a5b6c7d8e9f0" } });
 * new MobileHealthIndicatorDriver(config);
 */
export class InfraMobileConfig extends Config({ schema: InfraMobileOptions }) {}
