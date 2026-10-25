/**
 * Stackra file contract:
 * Purpose: unit tests of `localizeValue`: a string-keyed record of strings becomes the locale's string at the top, in a
 *          nested shape, in a list, behind optional and default wrappers and inside the matching union option, while an
 *          enum-keyed record, a fixed-key shape of strings and an undeclared key stay as parsed.
 * Boundary: test only; hand-written zod schemas in the form gen compiles a block's fields to.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0110 (decision 1); ADR 0162 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";
import { z } from "zod";

import { localizeValue } from "#core/functions/localize-value.function";

/** A `LocalizedText` field as gen compiles it. */
const text = () => z.record(z.string(), z.string());

describe("localizeValue", () => {
  it("reads every LocalizedText in the locale, however deep", () => {
    const schema = z.object({
      title: text(),
      cta: z.object({ label: text(), route: z.string() }).optional(),
      features: z.array(z.object({ title: text(), icon: z.string() })),
      tagline: text().default({ en: "Hello" }),
    });
    const value = {
      title: { en: "Sell online", ar: "بع عبر الإنترنت" },
      cta: { label: { en: "Pricing", ar: "الأسعار" }, route: "pricing" },
      features: [{ title: { en: "Fast", ar: "سريع" }, icon: "zap" }],
      tagline: { en: "Hello" },
    };
    expect(localizeValue(schema, value, "ar-SA")).toEqual({
      title: "بع عبر الإنترنت",
      cta: { label: "الأسعار", route: "pricing" },
      features: [{ title: "سريع", icon: "zap" }],
      tagline: "Hello",
    });
  });

  it("picks the union option the value parses with", () => {
    const schema = z.discriminatedUnion("verb", [
      z.object({ verb: z.literal("navigate"), route: z.string() }),
      z.object({ verb: z.literal("say"), text: text() }),
    ]);
    expect(localizeValue(schema, { verb: "say", text: { en: "Hi", ar: "مرحبا" } }, "ar")).toEqual({
      verb: "say",
      text: "مرحبا",
    });
    expect(localizeValue(schema, { verb: "navigate", route: "home" }, "ar")).toEqual({
      verb: "navigate",
      route: "home",
    });
  });

  it("leaves an enum-keyed record, a fixed-key shape, an unknown key and null as parsed", () => {
    const schema = z.object({
      sizes: z.record(z.enum(["s", "m"]), z.string()),
      link: z.object({ href: z.string() }),
      note: text().nullable(),
    });
    const value = {
      sizes: { s: "Small", m: "Medium" },
      link: { href: "/a" },
      note: null,
      extra: 1,
    };
    expect(localizeValue(schema, value, "en")).toEqual(value);
  });

  it("walks the values of a record of shapes", () => {
    const schema = z.record(z.string(), z.object({ label: text() }));
    expect(localizeValue(schema, { a: { label: { en: "A", ar: "أ" } } }, "ar")).toEqual({
      a: { label: "أ" },
    });
  });
});
