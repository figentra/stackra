/**
 * Stackra file contract:
 * Purpose: unit and type tests of `ConsentConfig`: the declining defaults, the derived key `consent`, the template's
 *          web and mobile overrides (`override` members under the `BaseConsentConfig` alias) build and validate, and a
 *          bad value fails the boot with `ConfigInvalidError`.
 * Boundary: test only; builds through @stackra/config's `buildConfig`, as `createApp` does.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 19
 *                     and 20); ADR 0298.
 */
import { buildConfig, Config, ConfigInvalidError, configKey } from "@stackra/config";
import type { ConfigValues } from "@stackra/config";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { ConsentConfig } from "#config/consent.config";
import { ConsentCategory } from "#core/enums/consent-category.enum";
import { ConsentRegime } from "#core/enums/consent-regime.enum";
import type { ConsentCategoryEntry } from "#core/types/consent-category-entry.type";

/** The package class under the alias a host imports it by. */
const BaseConsentConfig = ConsentConfig;

/** The template web app's override. */
class WebConsentConfig extends BaseConsentConfig {
  override categories: ConsentConfig["categories"] = [
    {
      category: ConsentCategory.Necessary,
      required: true,
      defaultGranted: true,
      descriptionKey: "web::consent.necessary",
    },
    {
      category: ConsentCategory.Analytics,
      required: false,
      defaultGranted: false,
      descriptionKey: "web::consent.analytics_category",
    },
  ];

  override cookieName = "consent";

  override expiryDays = 180;

  override policyVersion = "2026-10";

  override regionDefaults: Record<string, ConsentRegime> = { default: ConsentRegime.Gdpr };
}

/** The template mobile app's override. */
class MobileConsentConfig extends BaseConsentConfig {
  override policyVersion = "2026-10";

  override askOnFirstLaunch = true;
}

describe("ConsentConfig", () => {
  it("declines by default: only the required necessary category, no region regime", () => {
    const config = buildConfig(ConsentConfig);
    expect(config).toBeInstanceOf(Config);
    expect(Object.isFrozen(config)).toBe(true);
    expect({ ...config }).toEqual({
      categories: [
        {
          category: ConsentCategory.Necessary,
          required: true,
          defaultGranted: true,
          descriptionKey: null,
        },
      ],
      cookieName: "consent",
      expiryDays: 180,
      policyVersion: "1",
      regionDefaults: {},
      askOnFirstLaunch: false,
      snapshotLifetimeMinutes: 1440,
      snapshotClockSkewSeconds: 60,
    });
  });

  it("types its fields on the class", () => {
    const config = new ConsentConfig();
    expectTypeOf(config.categories).toEqualTypeOf<ConsentCategoryEntry[]>();
    expectTypeOf(config.cookieName).toEqualTypeOf<string>();
    expectTypeOf(config.expiryDays).toEqualTypeOf<number>();
    expectTypeOf(config.policyVersion).toEqualTypeOf<string>();
    expectTypeOf(config.regionDefaults).toEqualTypeOf<Record<string, ConsentRegime>>();
    expectTypeOf(config.askOnFirstLaunch).toEqualTypeOf<boolean>();
    expectTypeOf(config.snapshotLifetimeMinutes).toEqualTypeOf<number>();
    expectTypeOf(config.snapshotClockSkewSeconds).toEqualTypeOf<number>();
  });

  it("derives the key consent, for the base and for a host override", () => {
    expect(configKey(ConsentConfig, "consent")).toBe("consent");
    expect(configKey(WebConsentConfig, "consent")).toBe("consent");
  });

  it("builds the web override on top of the defaults", () => {
    const config = buildConfig(WebConsentConfig);
    expect(config).toBeInstanceOf(ConsentConfig);
    expect(config.categories.map((entry) => entry.category)).toEqual(["necessary", "analytics"]);
    expect(config.policyVersion).toBe("2026-10");
    expect(config.regionDefaults).toEqual({ default: "gdpr" });
  });

  it("builds the mobile override on top of the defaults", () => {
    const config = buildConfig(MobileConsentConfig);
    expect(config.askOnFirstLaunch).toBe(true);
    expect(config.cookieName).toBe("consent");
  });

  it.each([
    ["a cookie name with a separator", { cookieName: "con;sent" }],
    ["an empty policy version", { policyVersion: "" }],
    ["no expiry", { expiryDays: 0 }],
    ["an expiry past 400 days", { expiryDays: 401 }],
    ["an unknown regime", { regionDefaults: { default: "unknown_regime" } }],
    [
      "a required category not granted by default",
      {
        categories: [
          { category: "necessary", required: true, defaultGranted: false, descriptionKey: null },
        ],
      },
    ],
    [
      "a category listed twice",
      {
        categories: [
          { category: "analytics", required: false, defaultGranted: false, descriptionKey: null },
          { category: "analytics", required: false, defaultGranted: true, descriptionKey: null },
        ],
      },
    ],
    [
      "an unknown category",
      {
        categories: [
          { category: "telemetry", required: false, defaultGranted: false, descriptionKey: null },
        ],
      },
    ],
  ])("refuses %s at boot", (_case, values) => {
    expect(() =>
      buildConfig(ConsentConfig, {
        // The values are invalid on purpose; the boot check, not the type, must refuse them.
        values: values as Partial<ConfigValues<ConsentConfig>>,
      }),
    ).toThrow(ConfigInvalidError);
  });
});
