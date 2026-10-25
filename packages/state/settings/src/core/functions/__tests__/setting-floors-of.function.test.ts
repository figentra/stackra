/**
 * Stackra file contract:
 * Purpose: unit tests of `settingFloorsOf`: pack floors in force on a date reach the keys that name them, grouped by
 *          module with section paths; a key with no floor, a value with no floor and a dated-out floor give none; a
 *          floor that is not a number or boolean throws.
 * Boundary: test only; the pack is built by hand.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0370 (decision 6).
 */
import type { I18nKey } from "@stackra/i18n";
import type { MarketPack, ResolvedPack } from "@stackra/market-packs";
import { describe, expect, it } from "@stackra/testing";

import { SettingType } from "#core/enums/setting-type.enum";
import { settingFloorsOf } from "#core/functions/setting-floors-of.function";
import type { SettingKey } from "#core/types/setting-key.type";

const PACK: MarketPack = {
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
    { key: "consumer.label", value: "x", from: "2026-01-01", floor: { bound: "min", law: "L" } },
    { key: "tax.vat", value: 19, from: "2026-01-01" },
    {
      key: "old.floor",
      value: 3,
      from: "2020-01-01",
      until: "2021-01-01",
      floor: { bound: "max", law: "L" },
    },
  ],
  reviews: [],
  checklist: [],
};
const RESOLVED: ResolvedPack = { market: "eu", layers: [PACK] };

/** A key of `orders` with `floor`. */
const key = (name: string, floor?: string, section?: string): SettingKey => ({
  type: SettingType.Integer,
  default: 0,
  scopes: ["platform"],
  label: "orders::settings.x.label" as I18nKey,
  module: "orders",
  name,
  path: section === undefined ? `orders.${name}` : `orders.${section}.${name}`,
  ...(floor === undefined ? {} : { floor }),
  ...(section === undefined ? {} : { section }),
});

describe("settingFloorsOf", () => {
  it("matches floors to the keys that name them, by group", () => {
    const floors = settingFloorsOf(RESOLVED, "2026-10-25", [
      key("refundWindowDays", "consumer.withdrawal_days", "returns"),
      key("vat", "tax.vat"),
      key("plain"),
      key("old", "old.floor"),
    ]);
    expect([...floors.keys()]).toEqual(["orders"]);
    expect(floors.get("orders")).toEqual([
      {
        path: "returns.refundWindowDays",
        value: 14,
        bound: "min",
        law: "EU 2011/83",
        market: "eu",
        version: "1.2.0",
      },
    ]);
  });

  it("throws on a floor that cannot bound a setting", () => {
    expect(() => settingFloorsOf(RESOLVED, "2026-10-25", [key("label", "consumer.label")])).toThrow(
      TypeError,
    );
  });
});
