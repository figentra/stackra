/**
 * Stackra file contract:
 * Purpose: type tests of `LocalizedText`: a record of strings keyed by locale tag, read-only, refusing a non-string.
 * Boundary: test only; the assertions are compile-time (`@ts-expect-error`) plus runtime checks of the same values.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); STA-1383.
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { LocalizedText } from "#core/types/localized-text.type";

describe("LocalizedText", () => {
  it("is a read-only record of strings per locale", () => {
    const title: LocalizedText = { en: "Start today", "ar-SA": "ابدأ اليوم" };
    expectTypeOf<LocalizedText>().toEqualTypeOf<Readonly<Record<string, string>>>();
    expect(title.en).toBe("Start today");
  });

  it("refuses a non-string value", () => {
    // @ts-expect-error -- every locale holds a string
    const wrong: LocalizedText = { en: 1 };
    expect(wrong).toBeDefined();
  });
});
