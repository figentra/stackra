/**
 * Stackra file contract:
 * Purpose: unit tests of `SentryConfig`: a configuration keyed `errors.sentry` that builds with the shipped defaults,
 *          takes runway values and a host override, and refuses a rate outside 0 to 1 or a secret name that is not
 *          SCREAMING_SNAKE.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 19, 20 and 26).
 */
import { buildConfig, Config, ConfigInvalidError, configKey } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";

import { SentryConfig } from "#config/sentry.config";
import { SENTRY_CONFIG_SCHEMA } from "#core/constants/sentry-config-schema.constant";

const BaseSentryConfig = SentryConfig;

class HostSentryConfig extends BaseSentryConfig {
  override environment = "production";
}

describe("SentryConfig", () => {
  it("is a configuration keyed errors.sentry", () => {
    expect(new SentryConfig()).toBeInstanceOf(Config);
    expect(configKey(SentryConfig, "errors")).toBe("errors.sentry");
  });

  it("builds with the defaults, a runway value and a host override", () => {
    expect({ ...buildConfig(SentryConfig) }).toEqual(SENTRY_CONFIG_SCHEMA.parse({}));
    expect(buildConfig(SentryConfig, { values: { sampleRate: 0.25 } }).sampleRate).toBe(0.25);
    expect(buildConfig(HostSentryConfig).environment).toBe("production");
  });

  it("refuses a bad rate or secret name", () => {
    expect(() => buildConfig(SentryConfig, { values: { sampleRate: 2 } })).toThrow(
      ConfigInvalidError,
    );
    expect(() => buildConfig(SentryConfig, { values: { dsnSecret: "sentry-dsn" } })).toThrow(
      ConfigInvalidError,
    );
  });
});
