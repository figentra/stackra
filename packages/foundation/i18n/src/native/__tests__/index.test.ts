/**
 * Stackra file contract:
 * Purpose: entry test of `@stackra/i18n/native`: it exports exactly the language switcher hook and component.
 * Boundary: test only. React Native does not load in vitest, so `react-native` is replaced by the three members the
 *           entry reads.
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

describe("@stackra/i18n/native", () => {
  it("exports exactly the language switcher", () => {
    expect(Object.keys(native).sort()).toEqual(["LanguageSwitcher", "useLanguageSwitcher"]);
  });
});
