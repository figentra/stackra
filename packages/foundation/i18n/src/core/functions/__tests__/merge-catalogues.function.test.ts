/**
 * Stackra file contract:
 * Purpose: unit tests of `mergeCatalogues`: later catalogues win key by key at every depth (a regional overlay over its
 *          base language over the default), leaves replace whole, no input is mutated, and a JSON `__proto__` key never
 *          reaches the prototype.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0080 (as amended by 0305 conventions 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { mergeCatalogues } from "#core/functions/merge-catalogues.function";

describe("mergeCatalogues", () => {
  it("merges an overlay over its base language key by key", () => {
    const en = { nav: { home: "Home", help: "Help centre" }, hero: { title: "Sell more" } };
    const enUs = { nav: { help: "Help center" } };
    expect(mergeCatalogues([en, enUs])).toEqual({
      nav: { home: "Home", help: "Help center" },
      hero: { title: "Sell more" },
    });
  });

  it("applies the chain farthest first, so the nearest locale wins", () => {
    const en = { cta: { button: "Start", note: "Free" } };
    const ar = { cta: { button: "ابدأ" } };
    const arSa = { cta: { note: "مجاناً" } };
    expect(mergeCatalogues([en, ar, arSa])).toEqual({ cta: { button: "ابدأ", note: "مجاناً" } });
  });

  it("replaces a leaf whole, an intent phrase list included", () => {
    expect(mergeCatalogues([{ intents: ["enrol", "join"] }, { intents: ["enroll"] }])).toEqual({
      intents: ["enroll"],
    });
  });

  it("returns an empty catalogue for no input and never mutates an input", () => {
    expect(mergeCatalogues([])).toEqual({});
    const base = { nav: { home: "Home" } };
    mergeCatalogues([base, { nav: { home: "Start" } }]);
    expect(base).toEqual({ nav: { home: "Home" } });
  });

  it("drops a parsed __proto__ key instead of replacing the prototype", () => {
    const merged = mergeCatalogues([
      JSON.parse('{"__proto__": {"polluted": "yes"}, "ok": "fine"}'),
    ]);
    expect(merged).toEqual({ ok: "fine" });
    expect(({} as Record<string, unknown>)["polluted"]).toBeUndefined();
    expect(Object.getPrototypeOf(merged)).toBe(Object.prototype);
  });
});
