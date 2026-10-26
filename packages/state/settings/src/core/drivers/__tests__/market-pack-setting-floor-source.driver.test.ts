/**
 * Stackra file contract:
 * Purpose: unit tests of `MarketPackSettingFloorSourceDriver`: the floors of a registered group come from the pack on
 *          the clock's day, a group with no floor-bearing key has none, and an unregistered group is refused.
 * Boundary: test only; keys registered with `settingKeys`, the pack built by hand.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0370 (decision 6); ADR 0419 (decision 2).
 */
import type { Clock } from "@stackra/contracts";
import type { I18nKey } from "@stackra/i18n";
import type { ResolvedPack } from "@stackra/market-packs";
import { describe, expect, it } from "@stackra/testing";

import { SettingFloorSource } from "#contracts/index";
import { MarketPackSettingFloorSourceDriver } from "#core/drivers/market-pack-setting-floor-source.driver";
import { SettingType } from "#core/enums/setting-type.enum";
import { settingKeys } from "#core/functions/setting-keys.function";

settingKeys({
  pack_floored: {
    windowDays: {
      type: SettingType.Integer,
      default: 7,
      scopes: ["platform"],
      label: "pack_floored::settings.window_days.label" as I18nKey,
      floor: "consumer.withdrawal_days",
    },
  },
  pack_plain: {
    banner: {
      type: SettingType.String,
      default: "",
      scopes: ["platform"],
      label: "pack_plain::settings.banner.label" as I18nKey,
    },
  },
});

const PACK: ResolvedPack = {
  market: "eu",
  layers: [
    {
      market: "eu",
      version: "1.2.0",
      status: "live",
      entries: [
        {
          key: "consumer.withdrawal_days",
          value: 14,
          from: "2026-01-01",
          floor: { bound: "min", law: "EU 2011/83" },
        },
      ],
      reviews: [],
      checklist: [],
    },
  ],
};
const CLOCK = { now: () => new Date("2026-10-26T09:00:00.000Z") } as unknown as Clock;

describe(MarketPackSettingFloorSourceDriver, () => {
  const source = new MarketPackSettingFloorSourceDriver(PACK, CLOCK);

  it("answers the pack's floors on a registered group", async () => {
    expect(source).toBeInstanceOf(SettingFloorSource);
    await expect(source.floors("pack_floored")).resolves.toEqual([
      {
        path: "windowDays",
        value: 14,
        bound: "min",
        law: "EU 2011/83",
        market: "eu",
        version: "1.2.0",
      },
    ]);
    await expect(source.floors("pack_plain")).resolves.toEqual([]);
  });

  it("refuses a group this process has not registered", async () => {
    await expect(source.floors("pack_missing")).rejects.toThrow(/not registered/);
  });
});
