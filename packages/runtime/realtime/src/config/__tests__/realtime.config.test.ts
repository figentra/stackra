/**
 * Stackra file contract:
 * Purpose: unit tests of `RealtimeConfig`: a configuration over `RealtimeOptions` keyed `realtime`, built with its
 *          dev-safe defaults, the template's mobile and commerce overrides, a runway values layer, refused values,
 *          and the generated host schemas' `Base$.extend(...)` form over `RealtimeConfig$`.
 * Boundary: test only; the overrides restate the template's `apps/mobile/src/config/realtime.config.ts` and
 *           `services/commerce/src/config/realtime.config.ts`, and the extends restate their generated schemas.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 19, 20 and 26); ADR 0225.
 */
import { buildConfig, Config, ConfigInvalidError, configKey } from "@stackra/config";
import { Duration, Realm } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import { duration } from "@stackra/validation";

import { RealtimeConfig } from "#config/realtime.config";
import { REALTIME_CONFIG_SCHEMA } from "#core/constants/realtime-config-schema.constant";

const BaseRealtimeConfig = RealtimeConfig;

/** The template's mobile override. */
class MobileRealtimeConfig extends BaseRealtimeConfig {
  override reconnectOnForeground = true;

  override backgroundGraceSeconds = 30;

  override maxBackoffSeconds = 60;
}

/** The template's commerce override. */
class CommerceRealtimeConfig extends BaseRealtimeConfig {
  override channelRealms: Realm[] = [Realm.Staff];

  override subscribeTokenTtl = Duration.minutes(5);
}

describe("RealtimeConfig", () => {
  it("is a configuration keyed realtime, an override inheriting the key", () => {
    expect(new RealtimeConfig()).toBeInstanceOf(Config);
    expect(configKey(RealtimeConfig, "realtime")).toBe("realtime");
    expect(configKey(MobileRealtimeConfig, "realtime")).toBe("realtime");
  });

  it("builds with the dev-safe defaults", () => {
    const config = buildConfig(RealtimeConfig);
    const { fanoutValkeyUrl, ...defaults } = REALTIME_CONFIG_SCHEMA.parse({});
    expect({ ...config }).toEqual(defaults);
    expect(config.fanoutValkeyUrl).toBe(fanoutValkeyUrl);
    expect(config.driver).toBe("memory");
    expect(config.origin).toBe("");
    expect(config.channelRealms).toEqual(["platform", "tenant", "customer"]);
    expect(config.reconnectOnForeground).toBe(false);
  });

  it("applies the mobile and commerce overrides", () => {
    const mobile = buildConfig(MobileRealtimeConfig);
    expect(mobile.reconnectOnForeground).toBe(true);
    expect(mobile.backgroundGraceSeconds).toBe(30);
    expect(mobile.maxBackoffSeconds).toBe(60);
    const commerce = buildConfig(CommerceRealtimeConfig);
    expect(commerce.channelRealms).toEqual(["tenant"]);
    expect(commerce.subscribeTokenTtl).toBe("PT5M");
  });

  it("takes a runway values layer and an env-fed origin", () => {
    const config = buildConfig(CommerceRealtimeConfig, {
      values: { driver: "sse", origin: "https://api.acme.example" },
    });
    expect(config.driver).toBe("sse");
    expect(config.origin).toBe("https://api.acme.example");
    expect(config.channelRealms).toEqual(["tenant"]);
  });

  it("refuses an origin with a path, an unknown driver and a token shorter than ten seconds", () => {
    expect(() =>
      buildConfig(RealtimeConfig, { values: { origin: "https://api.acme.example/rt" } }),
    ).toThrow(ConfigInvalidError);
    expect(() => buildConfig(RealtimeConfig, { values: { driver: "redis" as "memory" } })).toThrow(
      ConfigInvalidError,
    );
    expect(() =>
      buildConfig(RealtimeConfig, { values: { subscribeTokenTtl: Duration.seconds(5) } }),
    ).toThrow(ConfigInvalidError);
  });

  it("is extended by the hosts' generated schemas", () => {
    const { shape } = REALTIME_CONFIG_SCHEMA;
    const Mobile$ = REALTIME_CONFIG_SCHEMA.extend({
      reconnectOnForeground: shape.reconnectOnForeground.unwrap().default(true),
      backgroundGraceSeconds: shape.backgroundGraceSeconds.unwrap().default(30),
      maxBackoffSeconds: shape.maxBackoffSeconds.unwrap().default(60),
    });
    const { fanoutValkeyUrl: _mobileSecret, ...mobile } = Mobile$.parse({});
    expect(mobile).toEqual({ ...buildConfig(MobileRealtimeConfig) });
    const Commerce$ = REALTIME_CONFIG_SCHEMA.extend({
      channelRealms: shape.channelRealms.unwrap().default(() => ["tenant" as const]),
      subscribeTokenTtl: shape.subscribeTokenTtl.unwrap().default(duration("5m")),
    });
    const { fanoutValkeyUrl: _commerceSecret, ...commerce } = Commerce$.parse({});
    expect(commerce).toEqual({ ...buildConfig(CommerceRealtimeConfig) });
  });
});
