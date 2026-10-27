/**
 * Stackra file contract:
 * Purpose: `RunwayConfig`, the configuration of @stackra/runway (key `runway`): what the `encore-cloud`, `eas` and
 *          `mintlify` providers need beyond the runway, injected into each by constructor type.
 * Boundary: a configuration class over `RunwayOptions` with no env map; the root runway's `config.runway` layer sets
 *           it. Loading this module registers the shipped schema, so `buildConfig` validates the class and every
 *           override.
 * Runtime: isomorphic
 * Governing contract: ADR 0352 (decision 3); ADR 0294 (decisions 19 and 20); ADR 0146 as amended.
 */
import { Config } from "@stackra/config";
import { registerSchemas } from "@stackra/validation";

import { RunwayConfig$ } from "#core/constants/runway-config-schema.constant";
import { RunwayOptions } from "#core/schemas/runway-options.schema";

// shortcut: registered here until gen writes the package's #stackra/schemas registration (registry gap G1, STA-339).
registerSchemas([[RunwayOptions, RunwayConfig$]]);

/**
 * The runway providers' settings.
 *
 * @example
 * const config = buildConfig(RunwayConfig, { values: { encoreApp: "acme" } });
 * const providers = [new EncoreCloudProviderDriver(config), new EasProviderDriver(config)];
 */
export class RunwayConfig extends Config({ schema: RunwayOptions }) {}
