/**
 * Stackra file contract:
 * Purpose: unit tests of `writeSitemap`: the namespaces, one `<url>` per entry with location, last change (string or
 *          date), change frequency, hreflang alternates and images, escaping of every value, a valid empty file,
 *          and the refusal of a file above 50,000 URLs.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0301 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { Changefreq } from "#core/enums/changefreq.enum";
import { writeSitemap } from "#core/functions/write-sitemap.function";

describe("writeSitemap", () => {
  it("writes a valid empty sitemap", () => {
    expect(writeSitemap([])).toBe(
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"' +
        ' xmlns:xhtml="http://www.w3.org/1999/xhtml"' +
        ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' +
        "</urlset>\n",
    );
  });

  it("writes every field of an entry", () => {
    const xml = writeSitemap([
      {
        loc: "https://acme.test/store/mug",
        lastmod: new Date("2026-10-24T08:00:00.000Z"),
        changefreq: Changefreq.Daily,
        alternates: {
          en: "https://acme.test/store/mug",
          "ar-SA": "https://acme.test/ar-sa/store/mug",
          "x-default": "https://acme.test/store/mug",
        },
        images: ["https://cdn.acme.test/mug.jpg"],
      },
    ]);
    expect(xml).toContain("<loc>https://acme.test/store/mug</loc>");
    expect(xml).toContain("<lastmod>2026-10-24T08:00:00.000Z</lastmod>");
    expect(xml).toContain("<changefreq>daily</changefreq>");
    expect(xml).toContain(
      '<xhtml:link rel="alternate" hreflang="ar-SA" href="https://acme.test/ar-sa/store/mug"/>',
    );
    expect(xml).toContain(
      '<xhtml:link rel="alternate" hreflang="x-default" href="https://acme.test/store/mug"/>',
    );
    expect(xml).toContain(
      "<image:image><image:loc>https://cdn.acme.test/mug.jpg</image:loc></image:image>",
    );
  });

  it("keeps a string last change as given and leaves out absent fields", () => {
    const xml = writeSitemap([{ loc: "https://acme.test/", lastmod: "2026-10-01" }]);
    expect(xml).toContain("<lastmod>2026-10-01</lastmod>");
    expect(xml).not.toContain("<changefreq>");
    expect(xml).not.toContain("xhtml:link rel");
    expect(xml).not.toContain("<image:image>");
  });

  it("writes no lastmod for an undefined one", () => {
    expect(writeSitemap([{ loc: "https://acme.test/", lastmod: undefined }])).not.toContain(
      "<lastmod>",
    );
  });

  it("escapes every value", () => {
    const xml = writeSitemap([
      {
        loc: "https://acme.test/store?a=1&b=<2>",
        alternates: { 'x"y': "https://acme.test/?q='1'" },
      },
    ]);
    expect(xml).toContain("<loc>https://acme.test/store?a=1&amp;b=&lt;2&gt;</loc>");
    expect(xml).toContain('hreflang="x&quot;y" href="https://acme.test/?q=&apos;1&apos;"');
  });

  it("refuses more than 50,000 URLs", () => {
    const entries = Array.from({ length: 50_001 }, (_, index) => ({
      loc: `https://acme.test/${index}`,
    }));
    expect(() => writeSitemap(entries)).toThrow(RangeError);
  });
});
