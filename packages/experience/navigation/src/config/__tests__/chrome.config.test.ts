/**
 * Stackra file contract:
 * Purpose: unit and type tests of `ChromeConfig` and its shipped `ChromeConfig$`: the platform defaults, the key
 *          `navigation.chrome`, the template's mobile override built by `buildConfig`, the generated override schema's
 *          `shape.header.unwrap().default(...)` pattern, and a wrong value refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0305 (rule 34).
 */
import { buildConfig, ConfigInvalidError, configKey } from "@stackra/config";
import { describe, expect, expectTypeOf, it } from "vitest";

import { ChromeConfig } from "#config/chrome.config";
import { ChromeConfig$ } from "#core/constants/chrome-config-schema.constant";
import { BackTitle } from "#core/enums/back-title.enum";
import type { ChromeHeader } from "#core/types/chrome-header.type";

/** The template mobile app's override, under the Base alias. */
const BaseChromeConfig = ChromeConfig;

class MobileChromeConfig extends BaseChromeConfig {
  override header = { ...this.header, blur: true, backTitle: BackTitle.Minimal };

  override tabBar = { ...this.tabBar, minimizeOnScroll: true, sidebarAdaptable: true };
}

describe("ChromeConfig", () => {
  it("defaults to the platform's own chrome", () => {
    expect({ ...buildConfig(ChromeConfig) }).toEqual({
      header: { style: "default", blur: false, backTitle: "default" },
      tabBar: { minimizeOnScroll: false, sidebarAdaptable: false },
    });
  });

  it("is keyed navigation.chrome", () => {
    expect(configKey(ChromeConfig, "navigation")).toBe("navigation.chrome");
  });

  it("builds the template's override", () => {
    expect({ ...buildConfig(MobileChromeConfig) }).toEqual({
      header: { style: "default", blur: true, backTitle: "minimal" },
      tabBar: { minimizeOnScroll: true, sidebarAdaptable: true },
    });
  });

  it("refuses a back title that is not a code", () => {
    class BadChromeConfig extends BaseChromeConfig {
      override header = { ...this.header, backTitle: "short" as BackTitle };
    }
    expect(() => buildConfig(BadChromeConfig)).toThrow(ConfigInvalidError);
  });

  it("types its fields", () => {
    expectTypeOf<ChromeConfig["header"]>().toEqualTypeOf<ChromeHeader>();
  });
});

describe("ChromeConfig$", () => {
  it("gives each object's defaults and extends the way gen's override schema does", () => {
    expect(ChromeConfig$.shape.header.parse(undefined)).toEqual({
      style: "default",
      blur: false,
      backTitle: "default",
    });
    const Override$ = ChromeConfig$.extend({
      header: ChromeConfig$.shape.header.unwrap().default(() => ({
        ...ChromeConfig$.shape.header.parse(undefined),
        blur: true,
        backTitle: "minimal" as const,
      })),
    });
    expect(Override$.parse({}).header).toEqual({
      style: "default",
      blur: true,
      backTitle: "minimal",
    });
  });
});
