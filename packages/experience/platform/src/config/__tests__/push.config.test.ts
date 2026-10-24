/**
 * Stackra file contract:
 * Purpose: unit and type tests of `PushConfig`: a configuration keyed `platform.push`, built with its defaults, the
 *          template mobile app's override (Expo transport, a quiet foreground, one orders channel, asked in the first
 *          session), a runway values layer, and a refused bad value.
 * Boundary: test only; the override is the template's `apps/mobile/src/config/push.config.ts` with the translation
 *           key written out.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 19 and 20); ADR 0255 (decision 3).
 */
import { buildConfig, Config, ConfigInvalidError, configKey } from "@stackra/config";
import type { DriverName } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { PushConfig as BasePushConfig } from "#config/push.config";
import type { PushTransport } from "#contracts/ports/push-transport.port";
import { PUSH_CONFIG_SCHEMA } from "#core/constants/push-config-schema.constant";
import { NotificationImportance } from "#core/enums/notification-importance.enum";
import { PromptMoment } from "#core/enums/prompt-moment.enum";

/** The template's override: the base's name, the package class aliased. */
class PushConfig extends BasePushConfig {
  override provider: DriverName<PushTransport> = "expo";

  override retries = 3;

  override foregroundBanner = true;

  override foregroundSound = false;

  override foregroundBadge = true;

  override androidChannels = [
    {
      id: "orders",
      nameKey: "mobile::push.channel_orders",
      importance: NotificationImportance.High,
      vibrate: true,
      sound: "default",
    },
  ];

  override askOn: PromptMoment = PromptMoment.FirstSession;

  override iosProvisional = false;
}

describe("PushConfig", () => {
  it("is a configuration keyed platform.push, an override inheriting the key", () => {
    expect(new BasePushConfig()).toBeInstanceOf(Config);
    expect(configKey(BasePushConfig, "platform")).toBe("platform.push");
    expect(configKey(PushConfig, "platform")).toBe("platform.push");
  });

  it("types its fields on the class and builds with the defaults", () => {
    const config = buildConfig(BasePushConfig);
    expectTypeOf(config.provider).toEqualTypeOf<"memory" | "web" | "expo" | "self_hosted">();
    expectTypeOf(config.askOn).toEqualTypeOf<PromptMoment>();
    expect({ ...config }).toEqual(PUSH_CONFIG_SCHEMA.parse({}));
    expect(Object.isFrozen(config)).toBe(true);
  });

  it("applies the template's override", () => {
    const config = buildConfig(PushConfig);
    expect(config.provider).toBe("expo");
    expect(config.foregroundSound).toBe(false);
    expect(config.askOn).toBe("first_session");
    expect(config.androidChannels).toEqual([
      {
        id: "orders",
        nameKey: "mobile::push.channel_orders",
        importance: "high",
        vibrate: true,
        sound: "default",
      },
    ]);
  });

  it("takes a runway values layer and refuses an unknown transport", () => {
    expect(buildConfig(BasePushConfig, { values: { provider: "self_hosted" } }).provider).toBe(
      "self_hosted",
    );
    expect(() =>
      buildConfig(BasePushConfig, { values: { provider: "carrier_pigeon" as "expo" } }),
    ).toThrow(ConfigInvalidError);
  });
});
