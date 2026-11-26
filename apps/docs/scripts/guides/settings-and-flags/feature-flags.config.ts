/**
 * Stackra file contract:
 * Purpose: `FeatureFlagsConfig`, the example flags configuration of the "Settings and feature flags" guide: values come
 *          from PostHog, and flags are split by tenant, so a rollout turns a flag on for whole tenants at a time.
 * Boundary: an override of the shipped configuration, as an app's `src/config/feature-flags.config.ts` would hold it;
 *           the PostHog project key is public and comes from the app's env configuration, never this file.
 * Runtime: isomorphic
 * Governing contract: ADR 0044 (package configuration); ADR 0213; STA-2852.
 */
import type { DriverName } from "@stackra/container";
import {
  FeatureFlagsConfig as BaseFeatureFlagsConfig,
  FlagTargeting,
} from "@stackra/feature-flags";
import type { FlagProvider } from "@stackra/feature-flags/contracts";

/** Flags from PostHog, targeted per tenant. */
export class FeatureFlagsConfig extends BaseFeatureFlagsConfig {
  override provider: DriverName<FlagProvider> = "posthog";

  override targeting: FlagTargeting = FlagTargeting.Scope;
}
