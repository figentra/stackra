/**
 * Stackra file contract:
 * Purpose: unit tests of `FeatureFlagsConfig`: a configuration over `FeatureFlagsOptions` keyed `feature_flags`, built
 *          with its dev-safe defaults, the template's web and mobile overrides, a runway values layer, a refused value
 *          key, and the generated host schema's `Base$.extend(...)` form over `FeatureFlagsConfig$`.
 * Boundary: test only; the overrides restate the template's `apps/{web,mobile}/src/config/feature-flags.config.ts`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 19, 20 and 26); ADR 0213 (decision 3).
 */
import { buildConfig, Config, ConfigInvalidError, configKey } from "@stackra/config";
import type { DriverName } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { FeatureFlagsConfig } from "#config/feature-flags.config";
import type { FlagProvider } from "#contracts/ports/flag-provider.port";
import { FEATURE_FLAGS_CONFIG_SCHEMA } from "#core/constants/feature-flags-config-schema.constant";
import { FlagTargeting } from "#core/enums/flag-targeting.enum";

const BaseFeatureFlagsConfig = FeatureFlagsConfig;

class WebFeatureFlagsConfig extends BaseFeatureFlagsConfig {
  override provider: DriverName<FlagProvider> = "config";

  override values: Record<string, boolean> = {};

  override targeting: FlagTargeting = FlagTargeting.Visitor;
}

class MobileFeatureFlagsConfig extends BaseFeatureFlagsConfig {
  override provider: DriverName<FlagProvider> = "config";

  override values: Record<string, boolean> = {};

  override refreshEvery = Duration.seconds(60);
}

describe("FeatureFlagsConfig", () => {
  it("is a configuration keyed feature_flags, an override inheriting the key", () => {
    expect(new FeatureFlagsConfig()).toBeInstanceOf(Config);
    expect(configKey(FeatureFlagsConfig, "feature_flags")).toBe("feature_flags");
    expect(configKey(WebFeatureFlagsConfig, "feature_flags")).toBe("feature_flags");
  });

  it("builds with the dev-safe defaults", () => {
    const config = buildConfig(FeatureFlagsConfig);
    expect({ ...config }).toEqual(FEATURE_FLAGS_CONFIG_SCHEMA.parse({}));
    expect(config.provider).toBe("config");
    expect(config.posthogKey).toBeNull();
  });

  it("applies the web and mobile overrides", () => {
    expect(buildConfig(WebFeatureFlagsConfig).targeting).toBe("visitor");
    const mobile = buildConfig(MobileFeatureFlagsConfig);
    expect(mobile.refreshEvery).toBe("PT1M");
    expect(mobile.targeting).toBe("user");
  });

  it("takes a runway values layer", () => {
    const config = buildConfig(WebFeatureFlagsConfig, {
      values: { provider: "posthog", posthogKey: "phc_test", values: { "web.help_centre": true } },
    });
    expect(config.provider).toBe("posthog");
    expect(config.values).toEqual({ "web.help_centre": true });
    expect(config.targeting).toBe("visitor");
  });

  it("refuses a value key that is not a flag key", () => {
    expect(() => buildConfig(FeatureFlagsConfig, { values: { values: { help: true } } })).toThrow(
      ConfigInvalidError,
    );
  });

  it("is extended by a host's generated schema", () => {
    const { shape } = FEATURE_FLAGS_CONFIG_SCHEMA;
    const Host$ = FEATURE_FLAGS_CONFIG_SCHEMA.extend({
      refreshEvery: shape.refreshEvery.unwrap().default(Duration.seconds(60)),
    });
    expect(Host$.parse({})).toEqual({ ...buildConfig(MobileFeatureFlagsConfig) });
  });
});
