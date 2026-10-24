/**
 * Stackra file contract:
 * Purpose: unit tests of `resolveSeo`, the SEO chain: later links win field by field in the order app defaults,
 *          static `seo`, `meta()`, tenant record; undefined links and fields are skipped; the title template and
 *          the site name; the derived canonical, alternates and image; `noindex` forced on a non-indexable site;
 *          JSON-LD escaped; hreflang and JSON-LD switched off by the config.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0301 (decisions 4 and 7).
 */
import { describe, expect, it } from "@stackra/testing";

import { resolveSeo } from "#core/functions/resolve-seo.function";

/** What is derived for the product page. */
const SITE = {
  name: "Acme",
  canonical: "https://acme.test/store/mug",
  alternates: { en: "https://acme.test/store/mug", "x-default": "https://acme.test/store/mug" },
  image: "https://acme.test/og/site/site_1",
  indexable: true,
};

/** The template's SEO config. */
const CONFIG = { titleTemplate: "%s · {siteName}", hreflang: true, jsonLd: true };

describe("resolveSeo", () => {
  it("runs the chain in order: defaults, static seo, meta(), tenant record", () => {
    const resolved = resolveSeo(
      [
        { title: "Default", description: "Default description", type: "website" },
        { title: "Static" },
        { title: "Blue mug", description: "A mug", type: "product" },
        { title: "Tenant title" },
      ],
      SITE,
      CONFIG,
    );
    expect(resolved.title).toBe("Tenant title · Acme");
    expect(resolved.description).toBe("A mug");
    expect(resolved.type).toBe("product");
  });

  it("skips undefined links and undefined fields", () => {
    const resolved = resolveSeo(
      [{ title: "Mug", noindex: true }, undefined, { title: undefined, noindex: undefined }],
      SITE,
      CONFIG,
    );
    expect(resolved.title).toBe("Mug · Acme");
    expect(resolved.noindex).toBe(true);
  });

  it("derives canonical, alternates, image, type and the site name", () => {
    const resolved = resolveSeo([], SITE, CONFIG);
    expect(resolved).toEqual({
      title: "Acme",
      description: undefined,
      canonical: SITE.canonical,
      alternates: SITE.alternates,
      image: SITE.image,
      type: "website",
      noindex: false,
      siteName: "Acme",
      jsonLd: [],
    });
  });

  it("lets a link set the canonical URL and the image", () => {
    const resolved = resolveSeo(
      [{ canonical: "https://acme.test/c", image: "https://acme.test/i.png" }],
      SITE,
      CONFIG,
    );
    expect(resolved.canonical).toBe("https://acme.test/c");
    expect(resolved.image).toBe("https://acme.test/i.png");
  });

  it("forces noindex on a site that is not indexable", () => {
    expect(resolveSeo([{ noindex: false }], { ...SITE, indexable: false }, CONFIG).noindex).toBe(
      true,
    );
  });

  it("inserts the page title literally", () => {
    expect(resolveSeo([{ title: "$& {siteName} %s" }], SITE, CONFIG).title).toBe(
      "$& {siteName} %s · Acme",
    );
  });

  it("escapes JSON-LD and keeps only the last link's list", () => {
    const resolved = resolveSeo(
      [
        { jsonLd: [{ "@type": "Organization" }] },
        { jsonLd: [{ "@type": "Product", name: "</script>" }] },
      ],
      SITE,
      CONFIG,
    );
    expect(resolved.jsonLd).toHaveLength(1);
    expect(resolved.jsonLd[0]).toContain('"@type":"Product"');
    expect(resolved.jsonLd[0]).not.toContain("</script>");
  });

  it("leaves out alternates and JSON-LD when the config turns them off", () => {
    const resolved = resolveSeo([{ jsonLd: [{ "@type": "Thing" }] }], SITE, {
      ...CONFIG,
      hreflang: false,
      jsonLd: false,
    });
    expect(resolved.alternates).toEqual({});
    expect(resolved.jsonLd).toEqual([]);
  });
});
