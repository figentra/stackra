/**
 * Stackra file contract:
 * Purpose: unit tests of `visibleSettingFields`: developer mode shows every key, normal mode the essential ones.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0359 (decisions 1 and 2).
 */
import type { I18nKey } from "@stackra/i18n";
import { describe, expect, it } from "@stackra/testing";

import { SettingType } from "#core/enums/setting-type.enum";
import { SettingsMode } from "#core/enums/settings-mode.enum";
import { visibleSettingFields } from "#core/functions/visible-setting-fields.function";
import type { SettingKey } from "#core/types/setting-key.type";
import type { SettingsPage } from "#core/types/settings-page.type";

const field = (name: string, essential?: boolean): SettingKey => ({
  type: SettingType.Boolean,
  default: true,
  scopes: ["platform"],
  label: "orders::settings.x.label" as I18nKey,
  module: "orders",
  name,
  path: `orders.${name}`,
  ...(essential === undefined ? {} : { essential }),
});
const PAGE: SettingsPage = {
  key: "orders",
  scope: "platform",
  panels: [],
  fields: [field("a", true), field("b"), field("c", false)],
};

describe("visibleSettingFields", () => {
  it("shows every field in developer mode", () => {
    expect(visibleSettingFields(PAGE, SettingsMode.Developer).map((f) => f.name)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("shows only essential fields in normal mode", () => {
    expect(visibleSettingFields(PAGE, SettingsMode.Normal).map((f) => f.name)).toEqual(["a"]);
  });
});
