/**
 * Stackra file contract:
 * Purpose: unit and type tests of `I18nConfig` and its shipped `I18nConfig$`: the launch defaults, the key `i18n`, a
 *          member override in the template's exact shape (Base alias, `override` fields, enum fields restated) built
 *          and frozen by `buildConfig`, and the refusals: a wrongly typed override, an empty or repeated locale list,
 *          a default or fallback locale that is not shipped, an unknown code and a cookie name that is not a token.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 19 and 20); ADR 0192; ADR 0297 (decision 4).
 */
import { buildConfig, ConfigInvalidError, configKey } from "@stackra/config";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { I18nConfig } from "#config/i18n.config";
import { I18nConfig$ } from "#core/constants/i18n-config-schema.constant";
import { Locale } from "#core/enums/locale.enum";
import { LocaleUrlStrategy } from "#core/enums/locale-url-strategy.enum";
import { NumberingSystem } from "#core/enums/numbering-system.enum";

/** The template web app's override, under the Base alias. */
const BaseI18nConfig = I18nConfig;

class SiteI18nConfig extends BaseI18nConfig {
  override locales: Locale[] = [Locale.En, Locale.EnUs, Locale.Ar, Locale.ArSa];

  override defaultLocale: Locale = Locale.En;

  override rtl: Locale[] = [Locale.Ar, Locale.ArSa];

  override fallbacks: Record<string, Locale[]> = {
    [Locale.ArSa]: [Locale.Ar, Locale.En],
    [Locale.Ar]: [Locale.En],
    [Locale.EnUs]: [Locale.En],
    [Locale.En]: [],
  };

  override numerals: NumberingSystem = NumberingSystem.Latn;

  override urlStrategy: LocaleUrlStrategy = LocaleUrlStrategy.PrefixExceptDefault;

  override failOnMissingLocale = true;

  override cookieName = "locale";
}

describe("I18nConfig", () => {
  it("defaults to an English-only launch member with Latin digits", () => {
    const config = buildConfig(I18nConfig);
    expect({ ...config }).toEqual({
      locales: ["en"],
      defaultLocale: "en",
      rtl: ["ar", "ar-SA", "ar-AE", "ar-EG"],
      fallbacks: {},
      numerals: "latn",
      formats: {},
      urlStrategy: "prefix_except_default",
      followDevice: false,
      tenantChoosesNumerals: false,
      failOnMissingLocale: false,
      cookieName: "locale",
    });
    expect(Object.isFrozen(config)).toBe(true);
  });

  it("derives the key i18n", () => {
    expect(configKey(I18nConfig, "i18n")).toBe("i18n");
    expect(configKey(SiteI18nConfig, "i18n")).toBe("i18n");
  });

  it("builds a member override in the template's shape", () => {
    const config = buildConfig(SiteI18nConfig);
    expect(config).toBeInstanceOf(I18nConfig);
    expect(config.locales).toEqual(["en", "en-US", "ar", "ar-SA"]);
    expect(config.fallbacks["ar-SA"]).toEqual(["ar", "en"]);
    expect(config.rtl.includes(Locale.ArSa)).toBe(true);
    expect(config.failOnMissingLocale).toBe(true);
    expectTypeOf(config.locales).toEqualTypeOf<Locale[]>();
    expectTypeOf(config.numerals).toEqualTypeOf<NumberingSystem>();
  });

  it("refuses a wrongly typed override at compile time and at build", () => {
    class Wrong extends I18nConfig {
      // @ts-expect-error -- a number is not a cookie name
      override cookieName = 42;
    }
    expect(() => buildConfig(Wrong)).toThrow(ConfigInvalidError);
  });

  it("refuses a default locale that is not shipped", () => {
    class Wrong extends I18nConfig {
      override defaultLocale: Locale = Locale.Ar;
    }
    expect(() => buildConfig(Wrong)).toThrow(ConfigInvalidError);
  });

  it("refuses a fallback chain through a locale that is not shipped", () => {
    class Wrong extends I18nConfig {
      override fallbacks: Record<string, Locale[]> = { en: [Locale.Ar] };
    }
    expect(() => buildConfig(Wrong)).toThrow(ConfigInvalidError);
  });

  it("refuses an empty or repeated locale list", () => {
    expect(I18nConfig$.safeParse({ locales: [] }).success).toBe(false);
    expect(I18nConfig$.safeParse({ locales: ["en", "en"] }).success).toBe(false);
  });

  it("refuses an unknown locale code and a cookie name that is not a token", () => {
    expect(I18nConfig$.safeParse({ locales: ["en", "tr"] }).success).toBe(false);
    expect(I18nConfig$.safeParse({ cookieName: "locale; Path=/admin" }).success).toBe(false);
  });

  it("extends like gen's override schema of a member", () => {
    const Member$ = I18nConfig$.extend({
      locales: I18nConfig$.shape.locales
        .unwrap()
        .default(() => [Locale.En, Locale.EnUs, Locale.Ar, Locale.ArSa]),
      numerals: I18nConfig$.shape.numerals.unwrap().default("user"),
      followDevice: I18nConfig$.shape.followDevice.unwrap().default(true),
    });
    const parsed = Member$.parse({});
    expect(parsed.locales).toEqual(["en", "en-US", "ar", "ar-SA"]);
    expect(parsed.numerals).toBe("user");
    expect(parsed.followDevice).toBe(true);
    expect(parsed.cookieName).toBe("locale");
  });

  it("takes a week start and clock override per locale, and refuses one out of range", () => {
    expect(I18nConfig$.parse({ formats: { en: { hourCycle: "h23" } } }).formats).toEqual({
      en: { hourCycle: "h23" },
    });
    expect(I18nConfig$.safeParse({ formats: { en: { weekStart: 8 } } }).success).toBe(false);
    expect(I18nConfig$.safeParse({ formats: { en: { hourCycle: "h24" } } }).success).toBe(false);
  });

  it("allows right-to-left locales the member does not ship", () => {
    const parsed = I18nConfig$.parse({ locales: ["en"], rtl: ["ar"] });
    expect(parsed.rtl).toEqual(["ar"]);
  });
});
