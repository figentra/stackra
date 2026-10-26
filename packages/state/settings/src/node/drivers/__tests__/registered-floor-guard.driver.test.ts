/**
 * Stackra file contract:
 * Purpose: unit tests of `RegisteredFloorGuardDriver`: no floor for a registered group with no floor-bearing key, and
 *          a refusal for an unregistered group and for a group with a legal floor.
 * Boundary: test only; keys registered with `settingKeys`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0370 (decision 6); ADR 0395 (decision 5).
 */
import type { I18nKey } from "@stackra/i18n";
import { describe, expect, it } from "@stackra/testing";

import { SettingFloorSource } from "#contracts/index";
import { SettingType } from "#core/enums/setting-type.enum";
import { settingKeys } from "#core/functions/setting-keys.function";
import { RegisteredFloorGuardDriver } from "#node/drivers/registered-floor-guard.driver";

settingKeys({
  guard_plain: {
    banner: {
      type: SettingType.String,
      default: "",
      scopes: ["platform"],
      label: "guard_plain::settings.banner.label" as I18nKey,
    },
  },
  guard_floored: {
    windowDays: {
      type: SettingType.Integer,
      default: 14,
      scopes: ["platform"],
      label: "guard_floored::settings.window_days.label" as I18nKey,
      floor: "consumer.withdrawal_days",
    },
  },
});

describe(RegisteredFloorGuardDriver, () => {
  const guard = new RegisteredFloorGuardDriver();

  it("is a floor source that answers no floor for a group without floor-bearing keys", async () => {
    expect(guard).toBeInstanceOf(SettingFloorSource);
    await expect(guard.floors("guard_plain")).resolves.toEqual([]);
  });

  it("refuses an unregistered group and a group with a legal floor", async () => {
    await expect(guard.floors("guard_missing")).rejects.toThrow(/not registered/);
    await expect(guard.floors("guard_floored")).rejects.toThrow(/legal floors/);
  });
});
