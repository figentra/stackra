/**
 * Stackra file contract:
 * Purpose: unit tests of `appLockPolicy`: no role or an unknown role gets the app-wide values, and a role's override
 *          wins field by field.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0250 (2026-10-29 note).
 */
import { buildConfig } from "@stackra/config";
import { Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { AppLockConfig as BaseAppLockConfig } from "#config/app-lock.config";
import { appLockPolicy } from "#core/functions/app-lock-policy.function";

/** A host's override: on for five minutes, managers lock after a minute and kiosks never lock. */
class AppLockConfig extends BaseAppLockConfig {
  override isEnabled = true;

  override roles = { manager: { lockAfter: Duration.minutes(1) }, kiosk: { isEnabled: false } };
}

const CONFIG = buildConfig(AppLockConfig);

describe("appLockPolicy", () => {
  it("gives no role and an unknown role the app-wide values", () => {
    const expected = { isEnabled: true, lockAfter: Duration.minutes(5) };
    expect(appLockPolicy(CONFIG, null)).toEqual(expected);
    expect(appLockPolicy(CONFIG, "cashier")).toEqual(expected);
  });

  it("merges a role's override field by field", () => {
    expect(appLockPolicy(CONFIG, "manager")).toEqual({
      isEnabled: true,
      lockAfter: Duration.minutes(1),
    });
    expect(appLockPolicy(CONFIG, "kiosk").isEnabled).toBe(false);
  });
});
