/**
 * Stackra file contract:
 * Purpose: `InfraIdentityConfig`, the configuration of @stackra/infra-identity (key `infra_identity`): the target `IdentityHealthIndicatorDriver` probes,
 *          injected by constructor type.
 * Boundary: a configuration class over `InfraIdentityOptions` with no env map; runway's `config.infra_identity` layer sets it per
 *           environment. Loading this module registers the shipped schema, so `buildConfig` validates the class and
 *           every override.
 * Runtime: isomorphic
 * Governing contract: ADR 0402 (decision 5); ADR 0294 (decisions 19 and 20); ADR 0146 as amended.
 */
import { Config } from "@stackra/config";
import { registerSchemas } from "@stackra/validation";

import { InfraIdentityConfig$ } from "#core/constants/infra-identity-config-schema.constant";
import { InfraIdentityOptions } from "#core/schemas/infra-identity-options.schema";

// shortcut: registered here until gen writes the package's #stackra/schemas registration (registry gap G1, STA-339).
registerSchemas([[InfraIdentityOptions, InfraIdentityConfig$]]);

/**
 * The health driver's target.
 *
 * @example
 * const config = buildConfig(InfraIdentityConfig, { values: { domain: "id.acme.example" } });
 * new IdentityHealthIndicatorDriver(config);
 */
export class InfraIdentityConfig extends Config({ schema: InfraIdentityOptions }) {}
