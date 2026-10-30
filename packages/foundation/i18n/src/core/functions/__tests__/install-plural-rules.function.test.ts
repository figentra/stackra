/**
 * Stackra file contract:
 * Purpose: unit tests of `installPluralRules`: a host with `Intl.PluralRules` is left alone, and on a host without it
 *          the fallback picks the CLDR categories of Arabic and English, and ICU plurals format again.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0268 (R15); CLDR plural rules (ar, en).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { installPluralRules } from "#core/functions/install-plural-rules.function";

describe("installPluralRules", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("keeps the host's PluralRules", () => {
    const native = Intl.PluralRules;
    installPluralRules();
    expect(Intl.PluralRules).toBe(native);
  });

  it("selects the Arabic and English categories when the host has none", () => {
    vi.stubGlobal("Intl", { ...Intl, PluralRules: undefined });
    installPluralRules();
    const ar = new Intl.PluralRules("ar-EG");
    expect([0, 1, 2, 3, 10, 11, 99, 100, 102, 1.5].map((n) => ar.select(n))).toEqual([
      "zero",
      "one",
      "two",
      "few",
      "few",
      "many",
      "many",
      "other",
      "other",
      "other",
    ]);
    const en = new Intl.PluralRules("en");
    expect([1, 2, 1.5].map((n) => en.select(n))).toEqual(["one", "other", "other"]);
    const ordinal = new Intl.PluralRules("en", { type: "ordinal" });
    expect([1, 2, 3, 4, 11, 22].map((n) => ordinal.select(n))).toEqual([
      "one",
      "two",
      "few",
      "other",
      "other",
      "two",
    ]);
  });
});
