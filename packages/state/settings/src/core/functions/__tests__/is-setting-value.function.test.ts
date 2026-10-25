/**
 * Stackra file contract:
 * Purpose: unit tests of `isSettingValue`: each key type takes its own values only, `null` only on a nullable key,
 *          numbers inside their bounds (whole numbers for an integer), and a connection key a `conn_` id only.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0307 (rules 22 and 23).
 */
import type { I18nKey } from "@stackra/i18n";
import { describe, expect, it } from "@stackra/testing";

import { SettingType } from "#core/enums/setting-type.enum";
import { isSettingValue } from "#core/functions/is-setting-value.function";
import type { SettingKeyInput } from "#core/types/setting-key-input.type";

/** A key of `type` with `extra` metadata. */
const keyOf = (type: SettingType, extra: Partial<SettingKeyInput> = {}): SettingKeyInput => ({
  type,
  default: null,
  scopes: ["platform"],
  label: "orders::settings.x.label" as I18nKey,
  ...extra,
});

describe("isSettingValue", () => {
  it("checks a boolean, a string and a connection id", () => {
    expect(isSettingValue(keyOf(SettingType.Boolean), true)).toBe(true);
    expect(isSettingValue(keyOf(SettingType.Boolean), "true")).toBe(false);
    expect(isSettingValue(keyOf(SettingType.String), "")).toBe(true);
    expect(isSettingValue(keyOf(SettingType.Connection), "conn_01J9Z3K4M5N6P7Q8R9S0T1V2W0")).toBe(
      true,
    );
    expect(isSettingValue(keyOf(SettingType.Connection), "sk_live_secret")).toBe(false);
  });

  it("checks numbers, whole numbers and bounds", () => {
    const minutes = keyOf(SettingType.Integer, { min: 5, max: 1440 });
    expect(isSettingValue(minutes, 30)).toBe(true);
    expect(isSettingValue(minutes, 30.5)).toBe(false);
    expect(isSettingValue(minutes, 4)).toBe(false);
    expect(isSettingValue(minutes, 1441)).toBe(false);
    expect(isSettingValue(keyOf(SettingType.Number), 0.25)).toBe(true);
    expect(isSettingValue(keyOf(SettingType.Number), Number.NaN)).toBe(false);
    expect(isSettingValue(keyOf(SettingType.Number), "1")).toBe(false);
  });

  it("takes null only on a nullable key", () => {
    expect(isSettingValue(keyOf(SettingType.Integer), null)).toBe(false);
    expect(isSettingValue(keyOf(SettingType.Integer, { nullable: true }), null)).toBe(true);
    expect(isSettingValue(keyOf(SettingType.Integer, { nullable: true }), undefined)).toBe(false);
  });
});
