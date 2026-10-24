/**
 * Stackra file contract:
 * Purpose: `FeatureFlagsOptions`, the shape of `FeatureFlagsConfig`: which `FlagProvider` driver answers, the values
 *          the `config` driver serves, which id flags are split by, how often values refresh, and the PostHog project
 *          key and host the `posthog` driver asks.
 * Boundary: a shape class; it registers this package's own schema (`FEATURE_FLAGS_CONFIG_SCHEMA`) for itself when the
 *           module loads. The defaults are dev-safe: the `config` driver with no values (every flag at its default),
 *           split by user, refreshed every five minutes, no PostHog key. The PostHog key is public; the host feeds it
 *           from its env configuration (`featureFlagsPosthogKey`), so this shape has no env map.
 * Runtime: isomorphic
 * Governing contract: ADR 0213 (decision 3: native and PostHog drivers, targeting, build-time flags); ADR 0294
 *                     (decisions 4, 19 and 26).
 */
import type { DriverName } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import { registerSchemas, Schema } from "@stackra/validation";

import type { FlagProvider } from "#contracts/ports/flag-provider.port";
import { FEATURE_FLAGS_CONFIG_SCHEMA } from "#core/constants/feature-flags-config-schema.constant";
import { FlagTargeting } from "#core/enums/flag-targeting.enum";

/**
 * The feature-flag settings of a member.
 *
 * @example
 * export class FeatureFlagsConfig extends BaseFeatureFlagsConfig {
 *   override provider: DriverName<FlagProvider> = "posthog";
 *   override targeting: FlagTargeting = FlagTargeting.Visitor;
 * }
 */
export class FeatureFlagsOptions extends Schema {
  /** The `FlagProvider` driver: `config` in dev and on-prem, `posthog` in SaaS. */
  provider: DriverName<FlagProvider> = "config";

  /** The `config` driver's values by flag key; an unlisted flag takes its declared default. */
  values: Record<string, boolean> = {};

  /** Which id flags are split by. */
  targeting: FlagTargeting = FlagTargeting.User;

  /** How often a watching reader asks the provider again; at least one second. */
  refreshEvery: Duration = Duration.minutes(5);

  /** The PostHog project API key (public, `phc_...`); `null` when PostHog is not used. */
  posthogKey: string | null = null;

  /** The PostHog host, or a same-origin proxy path (`/ingest`) on the web. */
  posthogHost = "https://eu.i.posthog.com";
}

registerSchemas([[FeatureFlagsOptions, FEATURE_FLAGS_CONFIG_SCHEMA]]);
