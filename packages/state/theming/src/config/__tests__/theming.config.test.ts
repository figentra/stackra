/**
 * Stackra file contract:
 * Purpose: unit tests of `ThemingConfig`: a configuration over `ThemingOptions` keyed `theming`, built with the
 *          `stackra` theme's defaults, the template's console, web and mobile overrides (the nested `splash` merge
 *          included), a runway values layer, refused values, and the generated host schema's `Base$.extend(...)` form
 *          over `ThemingConfig$`.
 * Boundary: test only; the overrides restate the template's `apps/{console,web,mobile}/src/config/theming.config.ts`
 *           (the web logo as an asset entry, the mobile one as a key).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 19, 20 and 26); ADR 0302.
 */
import { buildConfig, Config, ConfigInvalidError, configKey } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";
import { STACKRA_THEME } from "@stackra/tokens";
import type { ColorScheme } from "@stackra/ui/contracts";

import { ThemingConfig } from "#config/theming.config";
import { THEMING_CONFIG_SCHEMA } from "#core/constants/theming-config-schema.constant";

const BaseThemingConfig = ThemingConfig;

class ConsoleThemingConfig extends BaseThemingConfig {
  override theme = "acme";

  override logo = {
    key: "console::public/logo.svg",
    file: "assets/public/logo.svg",
    overridable: true,
  } as const;

  override schemes: ColorScheme[] = ["light", "dark", "system"];

  override defaultScheme: ColorScheme = "system";

  override selfHostedFonts = true;
}

class WebThemingConfig extends BaseThemingConfig {
  override theme = "acme";

  override themeColor: ThemingConfig["themeColor"] = {
    ...(this as ThemingConfig).themeColor,
    light: "#fafaf9",
    dark: "#0c0a09",
  };

  override tenantOverride = true;
}

class MobileThemingConfig extends BaseThemingConfig {
  override theme = "acme";

  override logo = "mobile::public/logo.svg";

  override themeColor = { light: "#f7f7f5", dark: "#1c1e22" };

  override splash: ThemingConfig["splash"] = {
    ...(this as ThemingConfig).splash,
    background: { light: "#f7f7f5", dark: "#1c1e22" },
  };

  override selfHostedFonts = false;
}

describe("ThemingConfig", () => {
  it("is a configuration keyed theming, an override inheriting the key", () => {
    expect(new ThemingConfig()).toBeInstanceOf(Config);
    expect(configKey(ThemingConfig, "theming")).toBe("theming");
    expect(configKey(MobileThemingConfig, "theming")).toBe("theming");
  });

  it("builds with the stackra theme's defaults", () => {
    const config = buildConfig(ThemingConfig);
    expect({ ...config }).toEqual(THEMING_CONFIG_SCHEMA.parse({}));
    expect(config.theme).toBe(STACKRA_THEME.name);
    expect(config.logo).toBeNull();
    expect(config.schemes).toEqual(["light", "dark", "system"]);
    expect(config.defaultScheme).toBe("system");
    expect(config.themeColor).toEqual({
      light: STACKRA_THEME.colors.background.hexLight,
      dark: STACKRA_THEME.colors.background.hexDark,
    });
    expect(config.tenantOverride).toBe(false);
  });

  it("applies the console, web and mobile overrides", () => {
    const console = buildConfig(ConsoleThemingConfig);
    expect(console.theme).toBe("acme");
    expect(console.logo).toEqual({
      key: "console::public/logo.svg",
      file: "assets/public/logo.svg",
      overridable: true,
    });
    const web = buildConfig(WebThemingConfig);
    expect(web.themeColor).toEqual({ light: "#fafaf9", dark: "#0c0a09" });
    expect(web.tenantOverride).toBe(true);
    const mobile = buildConfig(MobileThemingConfig);
    expect(mobile.logo).toBe("mobile::public/logo.svg");
    expect(mobile.splash).toEqual({ background: { light: "#f7f7f5", dark: "#1c1e22" } });
    expect(mobile.selfHostedFonts).toBe(false);
  });

  it("takes a runway values layer", () => {
    const config = buildConfig(ConsoleThemingConfig, { values: { defaultScheme: "dark" } });
    expect(config.defaultScheme).toBe("dark");
    expect(config.theme).toBe("acme");
  });

  it("refuses a theme name, a logo, a scheme list and a colour that break the rules", () => {
    for (const values of [
      { theme: "Acme Theme" },
      { logo: "logo.svg" },
      { schemes: [] },
      { schemes: ["light", "light"] },
      { defaultScheme: "sepia" },
      { themeColor: { light: "white", dark: "#000000" } },
    ])
      expect(() => buildConfig(ThemingConfig, { values: values as never })).toThrow(
        ConfigInvalidError,
      );
  });

  it("is extended by a host's generated schema", () => {
    const { shape } = THEMING_CONFIG_SCHEMA;
    const Host$ = THEMING_CONFIG_SCHEMA.extend({
      theme: shape.theme.unwrap().default("acme"),
      logo: shape.logo.unwrap().default("mobile::public/logo.svg"),
      themeColor: shape.themeColor.unwrap().default(() => ({ light: "#f7f7f5", dark: "#1c1e22" })),
      splash: shape.splash.unwrap().default(() => ({
        ...shape.splash.parse(undefined),
        background: { light: "#f7f7f5", dark: "#1c1e22" },
      })),
      selfHostedFonts: shape.selfHostedFonts.unwrap().default(false),
    });
    expect(Host$.parse({})).toEqual({ ...buildConfig(MobileThemingConfig) });
  });
});
