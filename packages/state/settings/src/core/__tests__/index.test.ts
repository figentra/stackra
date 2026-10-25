/**
 * Stackra file contract:
 * Purpose: barrel test of the `.` entry: exactly its values, no port or internal function, and its public types
 *          resolve.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0294 (decision 15: one symbol, one entry).
 */
import type { I18nKey } from "@stackra/i18n";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as settings from "#core/index";
import type {
  ResolvedSetting,
  SettingChangeSet,
  SettingWriteOptions,
  SettingsChange,
  SettingKey,
  SettingKeyInput,
  SettingKeys,
  SettingLevel,
  SettingOptions,
  SettingsClass,
  SettingsNavigation,
  SettingsOptions,
  SettingsPage,
  SettingsPageOptions,
  SettingsRule,
  SettingsRules,
  SettingsSnapshot,
} from "#core/index";

describe("@stackra/settings", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(settings).sort()).toEqual([
      "MemorySettingFloorSourceDriver",
      "MemorySettingRevisionStoreDriver",
      "MemorySettingValueStoreDriver",
      "PromotionBaseStaleError",
      "Setting",
      "SettingBelowFloorError",
      "SettingFourEyesError",
      "SettingLiveReadOnlyError",
      "SettingRevisionClosedError",
      "SettingScope",
      "SettingType",
      "SettingValueInvalidError",
      "Settings",
      "SettingsChange$",
      "SettingsLockedError",
      "SettingsMode",
      "SettingsPack$",
      "SettingsPackService",
      "SettingsPromotableDriver",
      "SettingsReader",
      "SettingsResolver",
      "diffSettingsPacks",
      "settingFloorsOf",
      "settingKeys",
      "settingsPackFromYaml",
      "settingsPackToYaml",
      "settingsPage",
      "visibleSettingFields",
    ]);
  });

  it("resolves its public types", () => {
    expectTypeOf<SettingLevel>().toEqualTypeOf<string>();
    expectTypeOf<SettingOptions["lockable"]>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<SettingsOptions["scopes"]>().toEqualTypeOf<readonly string[]>();
    expectTypeOf<SettingsNavigation["group"]>().toEqualTypeOf<I18nKey>();
    expectTypeOf<SettingsPageOptions["scope"]>().toEqualTypeOf<string>();
    expectTypeOf<SettingsPage<"orders">["key"]>().toEqualTypeOf<"orders">();
    expectTypeOf<SettingKeyInput["label"]>().toEqualTypeOf<I18nKey>();
    expectTypeOf<SettingKey["path"]>().toEqualTypeOf<string>();
    expectTypeOf<
      SettingKeys<{ orders: { flag: SettingKeyInput } }>["orders"]["flag"]["name"]
    >().toEqualTypeOf<"flag">();
    expectTypeOf<SettingsRule["kind"]>().toEqualTypeOf<
      "less_than" | "at_most" | "greater_than" | "at_least"
    >();
    expectTypeOf<SettingsRules<object>>().toHaveProperty("atMost");
    expectTypeOf<SettingsSnapshot["locked"]>().toEqualTypeOf<readonly string[]>();
    expectTypeOf<InstanceType<SettingsClass>>().toHaveProperty("rules");
    expectTypeOf<SettingOptions["live"]>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<SettingKeyInput["floor"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<ResolvedSetting["holder"]>().toEqualTypeOf<string | null>();
    expectTypeOf<SettingWriteOptions["author"]>().toEqualTypeOf<string>();
    expectTypeOf<SettingsChange["lockedAfter"]>().toEqualTypeOf<boolean>();
    expectTypeOf<SettingChangeSet["removed"]>().toEqualTypeOf<readonly string[]>();
  });
});
