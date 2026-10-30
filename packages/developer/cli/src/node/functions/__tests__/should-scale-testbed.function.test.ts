/**
 * Stackra file contract:
 * Purpose: unit tests of `shouldScaleTestbed`, `decideTestbedFallback` and `resolveTestbedSettings`: the scale
 *          decision, the fallback decision and the settings order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0484.
 */
import { describe, expect, it } from "@stackra/testing";

import { decideTestbedFallback } from "#node/functions/decide-testbed-fallback.function";
import { resolveTestbedSettings } from "#node/functions/resolve-testbed-settings.function";
import { shouldScaleTestbed } from "#node/functions/should-scale-testbed.function";

describe("shouldScaleTestbed", () => {
  it("grows the group after two busy minutes while below the maximum", () => {
    expect(shouldScaleTestbed({ busySince: 0, now: 119_000, desired: 1, max: 3 })).toBe(false);
    expect(shouldScaleTestbed({ busySince: 0, now: 120_000, desired: 1, max: 3 })).toBe(true);
    expect(shouldScaleTestbed({ busySince: 0, now: 120_000, desired: 3, max: 3 })).toBe(false);
    expect(shouldScaleTestbed({ busySince: undefined, now: 999_999, desired: 1, max: 3 })).toBe(
      false,
    );
  });
});

describe("decideTestbedFallback", () => {
  it("dispatches only with no healthy box and a preset", () => {
    expect(decideTestbedFallback({ healthyCount: 0, preset: "verify" })).toBe("dispatch");
    expect(decideTestbedFallback({ healthyCount: 0, preset: undefined })).toBe("wait");
    expect(decideTestbedFallback({ healthyCount: 2, preset: "verify" })).toBe("wait");
  });
});

describe("resolveTestbedSettings", () => {
  it("takes the flag, then the environment, then the default", () => {
    const env = { STACKRA_TESTBED_REGION: "eu-west-2" };
    expect(resolveTestbedSettings({ region: "us-east-1" }, env, "/h").region).toBe("us-east-1");
    expect(resolveTestbedSettings({}, env, "/h").region).toBe("eu-west-2");
    expect(resolveTestbedSettings({}, {}, "/h")).toEqual({
      profile: "academorix",
      region: "eu-west-1",
      key: "/h/.ssh/academorix-ci.pem",
      user: "ubuntu",
    });
  });
});
