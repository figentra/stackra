/**
 * Stackra file contract:
 * Purpose: unit tests of `writeSitemapIndex`: one `<sitemap>` per file in order, escaping, a valid empty index, and
 *          the refusal of more than 50,000 files.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0301 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { writeSitemapIndex } from "#core/functions/write-sitemap-index.function";

describe("writeSitemapIndex", () => {
  it("lists each file in order", () => {
    expect(
      writeSitemapIndex([
        "https://acme.test/sitemaps/marketing-1.xml",
        "https://acme.test/sitemaps/products-1.xml",
      ]),
    ).toBe(
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        "  <sitemap><loc>https://acme.test/sitemaps/marketing-1.xml</loc></sitemap>\n" +
        "  <sitemap><loc>https://acme.test/sitemaps/products-1.xml</loc></sitemap>\n" +
        "</sitemapindex>\n",
    );
  });

  it("writes a valid empty index", () => {
    expect(writeSitemapIndex([])).toContain("<sitemapindex");
    expect(writeSitemapIndex([])).not.toContain("<sitemap>");
  });

  it("escapes a URL", () => {
    expect(writeSitemapIndex(["https://acme.test/s.xml?a=1&b=2"])).toContain("s.xml?a=1&amp;b=2");
  });

  it("refuses more than 50,000 files", () => {
    const files = Array.from(
      { length: 50_001 },
      (_, index) => `https://acme.test/sitemaps/p-${index}.xml`,
    );
    expect(() => writeSitemapIndex(files)).toThrow(RangeError);
  });
});
