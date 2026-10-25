/**
 * Stackra file contract:
 * Purpose: unit tests of `serializeJsonLd`, the escaper: values that try to close the script element, open a comment
 *          or start markup come out as unicode escapes, the line separators are escaped, the result parses back to
 *          the same data, `@context` is added only when absent, and undefined fields are dropped.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0301 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { serializeJsonLd } from "#core/functions/serialize-json-ld.function";

describe("serializeJsonLd", () => {
  it("cannot close the script element or start markup", () => {
    const text = serializeJsonLd({
      "@type": "Organization",
      name: "</script><script>alert(1)</script><!--",
    });
    expect(text).not.toMatch(/[<>]/);
    expect(text).toContain("\\u003c/script\\u003e");
    expect(text).toContain("\\u003c!--");
  });

  it("escapes ampersands and the line separators", () => {
    const text = serializeJsonLd({ "@type": "Thing", name: "a&b\u2028c\u2029d" });
    expect(text).toContain("a\\u0026b\\u2028c\\u2029d");
    expect(text).not.toMatch(/[&\u2028\u2029]/);
  });

  it("parses back to the same data, with the schema.org context", () => {
    const block = {
      "@type": "Product",
      name: "Mug </script>",
      offers: { price: "12.50" },
      image: ["a", "b"],
    };
    expect(JSON.parse(serializeJsonLd(block))).toEqual({
      "@context": "https://schema.org",
      ...block,
    });
  });

  it("keeps a context the block sets", () => {
    const text = serializeJsonLd({ "@context": "https://example.test/ctx", "@type": "Thing" });
    expect(JSON.parse(text)["@context"]).toBe("https://example.test/ctx");
  });

  it("drops undefined fields", () => {
    expect(JSON.parse(serializeJsonLd({ "@type": "Product", sku: undefined }))).toEqual({
      "@context": "https://schema.org",
      "@type": "Product",
    });
  });

  it("throws on a value JSON cannot carry", () => {
    expect(() => serializeJsonLd({ "@type": "Thing", count: 1n })).toThrow(TypeError);
  });
});
