/**
 * Stackra file contract:
 * Purpose: entry test of `@stackra/i18n/react`: it exports exactly the template's six hooks plus the provider the
 *          generated `Contexts` mounts, and the hook signatures match how the template calls them.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import type { Money } from "@stackra/money";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { I18nKey, Locale } from "#core/index";
import * as react from "#react/index";

describe("@stackra/i18n/react", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(react).sort()).toEqual([
      "I18nProvider",
      "useDateTime",
      "useLocale",
      "useLocaleChoice",
      "useMoney",
      "useNumber",
      "useTranslation",
    ]);
  });

  it("types the hooks as the template calls them", () => {
    expectTypeOf(react.useTranslation)
      .returns.toHaveProperty("t")
      .parameter(0)
      .toEqualTypeOf<I18nKey>();
    expectTypeOf(react.useLocale)
      .returns.toHaveProperty("setLocale")
      .parameter(0)
      .toEqualTypeOf<Locale>();
    expectTypeOf(react.useLocale)
      .returns.toHaveProperty("direction")
      .toEqualTypeOf<"ltr" | "rtl">();
    expectTypeOf(react.useLocaleChoice)
      .returns.toHaveProperty("chosen")
      .toEqualTypeOf<Locale | null>();
    expectTypeOf(react.useMoney).returns.toBeCallableWith(9900, "SAR");
    expectTypeOf(react.useMoney).returns.toBeCallableWith({} as Money);
    expectTypeOf(react.useNumber).returns.toBeCallableWith(12);
    expectTypeOf(react.useDateTime).returns.toBeCallableWith(new Date(), { dateStyle: "medium" });
  });
});
