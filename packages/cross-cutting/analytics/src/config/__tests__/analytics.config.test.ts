/**
 * Stackra file contract:
 * Purpose: unit and type tests of `AnalyticsConfig`: a configuration over `AnalyticsOptions` keyed `analytics`, built
 *          with defaults that send nothing, the template's web, console and mobile overrides, a runway values layer,
 *          and a refused gating category.
 * Boundary: test only; the overrides restate the template's `apps/{web,console,mobile}/src/config/analytics.config.ts`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 19, 20 and 26); ADR 0298.
 */
import { buildConfig, Config, ConfigInvalidError, configKey } from "@stackra/config";
import { ConsentCategory } from "@stackra/consent";
import type { DriverName } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { AnalyticsConfig } from "#config/analytics.config";
import type { AnalyticsDriver } from "#contracts/ports/analytics-driver.port";
import type { AnalyticsIdentity } from "#contracts/ports/analytics-identity.port";
import { ANALYTICS_CONFIG_SCHEMA } from "#core/constants/analytics-config-schema.constant";

const BaseAnalyticsConfig = AnalyticsConfig;

/** The public site's override. */
class WebAnalyticsConfig extends BaseAnalyticsConfig {
  override driver: DriverName<AnalyticsDriver> = "posthog";

  override ingestOrigin = "";

  override autocapturePageviews = true;

  override autocaptureClicks = true;

  override cookieless = true;

  override consentCategory: ConsentCategory = ConsentCategory.Analytics;

  override denyProperties = ["email", "phone"];
}

/** The console's and the mobile app's override (the same members). */
class ConsoleAnalyticsConfig extends BaseAnalyticsConfig {
  override driver: DriverName<AnalyticsDriver> = "posthog";

  override consentCategory: ConsentCategory = ConsentCategory.Analytics;

  override autocapturePageviews = true;

  override autocaptureClicks = false;

  override denyProperties = ["email", "phone"];
}

describe("AnalyticsConfig", () => {
  it("is a configuration keyed analytics, an override inheriting the key", () => {
    expect(new AnalyticsConfig()).toBeInstanceOf(Config);
    expect(configKey(AnalyticsConfig, "analytics")).toBe("analytics");
    expect(configKey(WebAnalyticsConfig, "analytics")).toBe("analytics");
  });

  it("types its fields on the class and builds with defaults that send nothing", () => {
    const config = buildConfig(AnalyticsConfig);
    expectTypeOf(config.driver).toEqualTypeOf<DriverName<AnalyticsDriver>>();
    expectTypeOf(config.consentCategory).toEqualTypeOf<ConsentCategory>();
    expectTypeOf(config.identityDriver).toEqualTypeOf<DriverName<AnalyticsIdentity>>();
    expect(config.identityDriver).toBe("memory");
    // The PostHog personal key is a secret: a hidden getter, empty until the secret store fills it.
    expect(Object.keys(config)).not.toContain("posthogPersonalApiKey");
    expect(config.posthogPersonalApiKey).toBe("");
    expect({ ...config, posthogPersonalApiKey: "" }).toEqual(ANALYTICS_CONFIG_SCHEMA.parse({}));
    expect(config.driver).toBe("none");
    expect(Object.isFrozen(config)).toBe(true);
  });

  it("applies the template's overrides", () => {
    const web = buildConfig(WebAnalyticsConfig);
    expect(web.autocaptureClicks).toBe(true);
    expect(web.denyProperties).toEqual(["email", "phone"]);
    const signedIn = buildConfig(ConsoleAnalyticsConfig);
    expect(signedIn.autocapturePageviews).toBe(true);
    expect(signedIn.autocaptureClicks).toBe(false);
    expect(signedIn.queueLimit).toBe(100);
  });

  it("takes a runway values layer", () => {
    const config = buildConfig(WebAnalyticsConfig, {
      values: { driver: "memory", queueLimit: 20 },
    });
    expect(config.driver).toBe("memory");
    expect(config.queueLimit).toBe(20);
    expect(config.autocaptureClicks).toBe(true);
  });

  it("has no vitals or replay switch: TelemetryConfig owns them", () => {
    expect("webVitals" in buildConfig(AnalyticsConfig)).toBe(false);
    expect("sessionReplay" in buildConfig(AnalyticsConfig)).toBe(false);
  });

  it("refuses gating analytics by the necessary category", () => {
    expect(() =>
      buildConfig(AnalyticsConfig, { values: { consentCategory: ConsentCategory.Necessary } }),
    ).toThrow(ConfigInvalidError);
  });
});
