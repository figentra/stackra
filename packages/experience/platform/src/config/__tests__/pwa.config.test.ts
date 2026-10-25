/**
 * Stackra file contract:
 * Purpose: unit and type tests of `PwaConfig`: a configuration keyed `platform.pwa`, built with its defaults, the
 *          template console's override (protocol handler, share target, file handler, balanced caching with route
 *          overrides, offline, push, updates, house install prompt) with each nested object spreading the base, and
 *          a refused bad value.
 * Boundary: test only; the override is the template's `apps/console/src/config/pwa.config.ts`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 19 and 20); ADR 0255.
 */
import { buildConfig, Config, ConfigInvalidError, configKey } from "@stackra/config";
import { Duration } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { PwaConfig as BasePwaConfig } from "#config/pwa.config";
import { PWA_CONFIG_SCHEMA } from "#core/constants/pwa-config-schema.constant";
import { CachePreset } from "#core/enums/cache-preset.enum";
import { CacheStrategy } from "#core/enums/cache-strategy.enum";
import { FileLaunchType } from "#core/enums/file-launch-type.enum";
import { InstallPrompt } from "#core/enums/install-prompt.enum";
import { PromptMoment } from "#core/enums/prompt-moment.enum";
import { UpdateStrategy } from "#core/enums/update-strategy.enum";

/** The template's override: the base's name, the package class aliased. */
class PwaConfig extends BasePwaConfig {
  override manifest: BasePwaConfig["manifest"] = {
    ...(this as BasePwaConfig).manifest,
    protocolHandlers: { "web+acme": "/open?url=%s" },
    shareTarget: {
      action: "/share",
      method: "POST",
      enctype: "multipart/form-data",
      params: {
        title: "title",
        text: "text",
        url: "url",
        files: [{ name: "images", accept: ["image/png", "image/jpeg", "image/webp"] }],
      },
    },
    fileHandlers: [
      {
        action: "/open-file",
        accept: { "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"] },
        launchType: FileLaunchType.SingleClient,
      },
    ],
  };

  override caching: BasePwaConfig["caching"] = {
    ...(this as BasePwaConfig).caching,
    preset: CachePreset.Balanced,
    routes: {
      "/assets/": CacheStrategy.CacheFirst,
      "/healthz": CacheStrategy.NetworkOnly,
    },
    maxEntries: 200,
    navigationPreload: true,
    offlineFallback: "/offline",
  };

  override offline: BasePwaConfig["offline"] = {
    ...(this as BasePwaConfig).offline,
    persistStorage: true,
    backgroundSync: true,
  };

  override push: BasePwaConfig["push"] = {
    ...(this as BasePwaConfig).push,
    enabled: true,
    askOn: PromptMoment.Settings,
    badging: true,
  };

  override updates: BasePwaConfig["updates"] = {
    ...(this as BasePwaConfig).updates,
    strategy: UpdateStrategy.Prompt,
    checkEvery: Duration.hours(1),
  };

  override install: BasePwaConfig["install"] = {
    ...(this as BasePwaConfig).install,
    prompt: InstallPrompt.House,
    afterSessions: 2,
    iosInstructions: true,
  };

  override periodicSync = false;
}

describe("PwaConfig", () => {
  it("is a configuration keyed platform.pwa, an override inheriting the key", () => {
    expect(new BasePwaConfig()).toBeInstanceOf(Config);
    expect(configKey(BasePwaConfig, "platform")).toBe("platform.pwa");
    expect(configKey(PwaConfig, "platform")).toBe("platform.pwa");
  });

  it("types its fields on the class and builds with the defaults", () => {
    const config = buildConfig(BasePwaConfig);
    expectTypeOf(config.caching.preset).toEqualTypeOf<CachePreset>();
    expectTypeOf(config.manifest.protocolHandlers).toEqualTypeOf<Record<string, string>>();
    expect({ ...config }).toEqual(PWA_CONFIG_SCHEMA.parse({}));
    expect(Object.isFrozen(config)).toBe(true);
  });

  it("applies the template's override, each nested object over the base", () => {
    const config = buildConfig(PwaConfig);
    expect(Object.keys(config.manifest.protocolHandlers)).toEqual(["web+acme"]);
    expect(config.manifest.shareTarget?.action).toBe("/share");
    expect(config.caching.preset).toBe("balanced");
    expect(config.caching.networkTimeout).toBe(Duration.seconds(3));
    expect(config.offline.bannerAfter).toBe(Duration.seconds(3));
    expect(config.install).toEqual({ prompt: "house", afterSessions: 2, iosInstructions: true });
  });

  it("refuses a protocol handler outside the web+ namespace", () => {
    expect(() =>
      buildConfig(BasePwaConfig, {
        values: {
          manifest: { protocolHandlers: { mailto: "/open" }, shareTarget: null, fileHandlers: [] },
        },
      }),
    ).toThrow(ConfigInvalidError);
  });
});
