/**
 * Stackra file contract:
 * Purpose: unit tests of `AppLockConfig`: keyed `platform.app_lock`, built with its defaults (off, five minutes, the
 *          passcode allowed, no role overrides), overridden by a host, and refusing a bad role override.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0250 (2026-10-29 note); ADR 0294 (decisions 19 and 20).
 */
import { buildConfig, ConfigInvalidError, configKey } from "@stackra/config";
import { Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { AppLockConfig as BaseAppLockConfig } from "#config/app-lock.config";

/** A host's override: on, and managers lock after a minute. */
class AppLockConfig extends BaseAppLockConfig {
  override isEnabled = true;

  override roles = { manager: { lockAfter: Duration.minutes(1) } };
}

describe("AppLockConfig", () => {
  it("is keyed platform.app_lock", () => {
    expect(configKey(BaseAppLockConfig, "platform")).toBe("platform.app_lock");
  });

  it("builds with its defaults: off until the app opts in", () => {
    const config = buildConfig(BaseAppLockConfig);
    expect(config.isEnabled).toBe(false);
    expect(Duration.toMilliseconds(config.lockAfter)).toBe(300_000);
    expect(config.allowPasscode).toBe(true);
    expect(config.roles).toEqual({});
  });

  it("takes a host's override", () => {
    const config = buildConfig(AppLockConfig);
    expect(config.isEnabled).toBe(true);
    expect(config.roles["manager"]?.lockAfter).toBe(Duration.minutes(1));
  });

  it("refuses a role override that is not a duration", () => {
    class BadAppLockConfig extends BaseAppLockConfig {
      override roles = { manager: { lockAfter: "soon" as Duration } };
    }
    expect(() => buildConfig(BadAppLockConfig)).toThrow(ConfigInvalidError);
  });
});
