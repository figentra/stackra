/**
 * Stackra file contract:
 * Purpose: unit and type tests of `settingsPage`: a page carries its module's keys, scope and panels, frozen; it keeps
 *          the keys it was built with when the module is declared again; a module with no keys is refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0307 (rule 24).
 */
import type { I18nKey } from "@stackra/i18n";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { SettingScope } from "#core/enums/setting-scope.enum";
import { SettingType } from "#core/enums/setting-type.enum";
import { settingKeys } from "#core/functions/setting-keys.function";
import { settingsPage } from "#core/functions/settings-page.function";

const marketing = {
  type: SettingType.Boolean,
  default: false,
  scopes: [SettingScope.User],
  label: "messages::settings.promotions.marketing.label" as I18nKey,
};

/** A panel class, as `#stackra/panels` exports one. */
class AdminPanel {}

describe("settingsPage", () => {
  it("carries the module's keys, its scope and its panels", () => {
    const Settings = settingKeys({ messages: { marketing } });
    const page = settingsPage("messages", { scope: SettingScope.User, panels: [AdminPanel] });
    expect(page).toEqual({
      key: "messages",
      scope: "user",
      panels: [AdminPanel],
      fields: [Settings.messages.marketing],
    });
    expect(Object.isFrozen(page)).toBe(true);
    expect(settingsPage("messages", { scope: SettingScope.User }).panels).toEqual([]);
    expectTypeOf(page.key).toEqualTypeOf<"messages">();
  });

  it("keeps its keys when the module is declared again", () => {
    settingKeys({
      inventory: { allowBackorders: { ...marketing, label: "inventory::x" as I18nKey } },
    });
    const page = settingsPage("inventory", { scope: SettingScope.Product });
    settingKeys({ inventory: {} });
    expect(page.fields.map((field) => field.name)).toEqual(["allowBackorders"]);
  });

  it("refuses a module with no keys", () => {
    expect(() => settingsPage("unknown_module", { scope: SettingScope.User })).toThrow(TypeError);
  });
});
