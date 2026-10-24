/**
 * Stackra file contract:
 * Purpose: unit tests of `Translated`: the fallback chain (exact tag, language, first stored, empty), a frozen copy,
 *          JSON as the locale map, and a bad map refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0162 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { Translated } from "#core/values/translated.value";

describe(Translated, () => {
  const title = Translated.of({ en: "Shirt", ar: "قميص", "ar-EG": "قميص مصري" });

  it("reads the exact tag, then the language, then the first stored", () => {
    expect(title.in("ar-EG")).toBe("قميص مصري");
    expect(title.in("ar-SA")).toBe("قميص");
    expect(title.in("fr")).toBe("Shirt");
    expect(Translated.of({}).in("en")).toBe("");
  });

  it("keeps a frozen copy and serializes as the map", () => {
    const values: Record<string, string> = { en: "Shirt" };
    const value = Translated.of(values);
    values["en"] = "Changed";
    expect(value.in("en")).toBe("Shirt");
    expect(Object.isFrozen(value.values)).toBe(true);
    expect(JSON.stringify(value)).toBe('{"en":"Shirt"}');
  });

  it("refuses a map that is not tags to strings", () => {
    expect(() => Translated.of(null as never)).toThrow(TypeError);
    expect(() => Translated.of(["Shirt"] as never)).toThrow(TypeError);
    expect(() => Translated.of({ en: 1 } as never)).toThrow(TypeError);
    expect(() => Translated.of({ "": "Shirt" })).toThrow(TypeError);
  });
});
