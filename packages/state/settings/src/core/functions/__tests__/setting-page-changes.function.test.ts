/**
 * Stackra file contract:
 * Purpose: unit tests of `settingPageChanges`: names map to paths; an unknown name or a bad value is refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0307 (rule 22); ADR 0213 (decision 2).
 */
import type { I18nKey } from "@stackra/i18n";
import { describe, expect, it } from "@stackra/testing";

import { SettingType } from "#core/enums/setting-type.enum";
import { SettingValueInvalidError } from "#core/errors/setting-value-invalid.error";
import { settingPageChanges } from "#core/functions/setting-page-changes.function";
import type { SettingsPage } from "#core/types/settings-page.type";

const PAGE: SettingsPage = {
  key: "orders",
  scope: "platform",
  panels: [],
  fields: [
    {
      type: SettingType.Integer,
      default: 30,
      min: 5,
      scopes: ["platform"],
      label: "orders::settings.x.label" as I18nKey,
      module: "orders",
      name: "minutes",
      section: "cancellation",
      path: "orders.cancellation.minutes",
    },
  ],
};

describe("settingPageChanges", () => {
  it("maps a page write to paths with its keys", () => {
    const { changes, keys } = settingPageChanges(PAGE, { minutes: 45 });
    expect(changes).toEqual({ "cancellation.minutes": 45 });
    expect(keys.map((key) => key.name)).toEqual(["minutes"]);
  });

  it("refuses a bad value and an unknown name", () => {
    expect(() => settingPageChanges(PAGE, { minutes: 1 })).toThrow(SettingValueInvalidError);
    expect(() => settingPageChanges(PAGE, { nope: 1 })).toThrow(SettingValueInvalidError);
  });
});
