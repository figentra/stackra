/**
 * Stackra file contract:
 * Purpose: `FeatureFlagsConfig`, a member's feature-flag configuration (key `feature_flags`): the provider by driver
 *          name, the build-time values, the targeting, the refresh interval and the PostHog key and host.
 * Boundary: a configuration class over `FeatureFlagsOptions` with no env map: the PostHog key's variable differs per
 *           target (`VITE_`, `EXPO_PUBLIC_`), so the host feeds it from its own env configuration. Its presence in a
 *           host's module graph mounts the flags context; this package only declares the values.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0213 (decision 3).
 */
import { Config } from "@stackra/config";

import { FeatureFlagsOptions } from "#core/schemas/feature-flags-options.schema";

/**
 * A member's feature-flag configuration.
 *
 * @example
 * import { FeatureFlagsConfig as BaseFeatureFlagsConfig, FlagTargeting } from "@stackra/feature-flags";
 *
 * export class FeatureFlagsConfig extends BaseFeatureFlagsConfig {
 *   override values: Record<string, boolean> = { "web.help_centre": true };
 *   override targeting: FlagTargeting = FlagTargeting.Visitor;
 * }
 */
export class FeatureFlagsConfig extends Config({ schema: FeatureFlagsOptions }) {}
