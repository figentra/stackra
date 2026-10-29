/**
 * Stackra file contract:
 * Purpose: unit tests of `LiveActivityConfig`: keyed `platform.live_activity`, built with its 15-minute dismissal, and
 *          overridden by a host.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 19 and 20); STA-1539.
 */
import { buildConfig, configKey } from "@stackra/config";
import { Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { LiveActivityConfig as BaseLiveActivityConfig } from "#config/live-activity.config";

/** A host's override: a booking stays an hour after it ends. */
class LiveActivityConfig extends BaseLiveActivityConfig {
  override endedDismissal = Duration.hours(1);
}

describe("LiveActivityConfig", () => {
  it("is keyed platform.live_activity", () => {
    expect(configKey(BaseLiveActivityConfig, "platform")).toBe("platform.live_activity");
  });

  it("builds with a 15-minute dismissal and takes a host's override", () => {
    expect(Duration.toMilliseconds(buildConfig(BaseLiveActivityConfig).endedDismissal)).toBe(
      900_000,
    );
    expect(Duration.toMilliseconds(buildConfig(LiveActivityConfig).endedDismissal)).toBe(3_600_000);
  });

  it("defaults the Android channel and leaves APNs unset on production", () => {
    const config = buildConfig(BaseLiveActivityConfig);
    expect(config.androidChannelId).toBe("live_activity");
    expect(config.apnsBundleId).toBeNull();
    expect(config.apnsEnvironment).toBe("production");
  });
});
