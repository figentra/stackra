/**
 * Stackra file contract:
 * Purpose: `InfraCloudflareConfig`, the configuration of @stackra/infra-cloudflare (key `infra_cloudflare`): the target `CloudflareHealthIndicatorDriver` probes,
 *          injected by constructor type.
 * Boundary: a configuration class over `InfraCloudflareOptions` with no env map; runway's `config.infra_cloudflare` layer sets it per
 *           environment. Loading this module registers the shipped schema, so `buildConfig` validates the class and
 *           every override.
 * Runtime: isomorphic
 * Governing contract: ADR 0402 (decision 5); ADR 0294 (decisions 19 and 20); ADR 0146 as amended.
 */
import { Config } from "@stackra/config";
import { registerSchemas } from "@stackra/validation";

import { InfraCloudflareConfig$ } from "#core/constants/infra-cloudflare-config-schema.constant";
import { InfraCloudflareOptions } from "#core/schemas/infra-cloudflare-options.schema";

// shortcut: registered here until gen writes the package's #stackra/schemas registration (registry gap G1, STA-339).
registerSchemas([[InfraCloudflareOptions, InfraCloudflareConfig$]]);

/**
 * The health driver's target.
 *
 * @example
 * const config = buildConfig(InfraCloudflareConfig, { values: { host: "api.acme.example" } });
 * new CloudflareHealthIndicatorDriver(config);
 */
export class InfraCloudflareConfig extends Config({ schema: InfraCloudflareOptions }) {}
