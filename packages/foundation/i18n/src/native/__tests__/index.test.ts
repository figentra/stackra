/**
 * Stackra file contract:
 * Purpose: entry test of `@stackra/i18n/native`: it exports exactly the language switcher hook and component and the phone's
 *          language and region readers.
 * Boundary: test only. React Native and the Expo libraries do not load in vitest, so they are replaced by the members
 *           the entry reads.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import * as native from "#native/index";

vi.mock("react-native", () => ({
  Platform: { OS: "ios", Version: "18.0" },
  Linking: { openSettings: async () => undefined },
  I18nManager: { isRTL: false, allowRTL: () => undefined, forceRTL: () => undefined },
}));
vi.mock("expo-constants", () => ({ default: {} }));
vi.mock("expo-intent-launcher", () => ({ startActivityAsync: async () => undefined }));
vi.mock("expo-localization", () => ({ getLocales: () => [], getCalendars: () => [] }));
vi.mock("expo-updates", () => ({ reloadAsync: async () => undefined }));

describe("@stackra/i18n/native", () => {
  it("exports exactly the language switcher and the device readers", () => {
    expect(Object.keys(native).sort()).toEqual([
      "LanguageSwitcher",
      "deviceLanguageTags",
      "deviceRegion",
      "useLanguageSwitcher",
    ]);
  });
});
