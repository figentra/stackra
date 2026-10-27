/**
 * Stackra file contract:
 * Purpose: unit tests of `parsePage`: title, language and readable text (hidden elements and comments dropped, blocks
 *          on their own lines, entities decoded, cut at the limit); product hints from JSON-LD `Product`, `@graph` and
 *          `ProductGroup` variants with absolute URLs; a broken JSON-LD block is skipped.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0450 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { parsePage } from "#core/functions/parse-page.function";

const BASE = "https://shop.example.com/products/abaya";

const HTML = `<!doctype html>
<html lang="ar-SA"><head><title> Black  Abaya &amp; Scarf </title>
<style>body { color: red }</style>
<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Organization","name":"Shop"},
{"@type":"Product","name":"Black Abaya","sku":"AB-1","brand":{"@type":"Brand","name":"Noor"},
"image":["/img/a.jpg",{"url":"https://cdn.example.net/b.jpg"},"javascript:alert(1)"],
"offers":{"@type":"Offer","price":"129.00","priceCurrency":"SAR","availability":"https://schema.org/InStock"}}]}</script>
<script type="application/ld+json">{ not json</script>
<script type="application/ld+json">{"@type":"ProductGroup","name":"Scarf","hasVariant":[
{"@type":"Product","name":"Scarf, red","offers":[{"price":45,"priceCurrency":"SAR"}],"url":"/products/scarf?v=red"}]}</script>
</head><body><!-- hidden note --><h1>Black Abaya</h1><p>Soft&nbsp;crepe &#8212; made in Riyadh.</p>
<script>window.secret = 1;</script><ul><li>Size S</li><li>Size M</li></ul></body></html>`;

describe(parsePage, () => {
  it("reads the title, language and text", () => {
    const reading = parsePage(HTML, BASE);
    expect(reading.title).toBe("Black Abaya & Scarf");
    expect(reading.lang).toBe("ar-SA");
    expect(reading.text).toBe("Black Abaya\nSoft crepe — made in Riyadh.\nSize S\nSize M");
    expect(reading.truncated).toBe(false);
  });

  it("reads the product hints", () => {
    expect(parsePage(HTML, BASE).products).toEqual([
      {
        name: "Black Abaya",
        sku: "AB-1",
        brand: "Noor",
        images: ["https://shop.example.com/img/a.jpg", "https://cdn.example.net/b.jpg"],
        price: "129.00",
        currency: "SAR",
        availability: "InStock",
      },
      {
        name: "Scarf, red",
        images: [],
        url: "https://shop.example.com/products/scarf?v=red",
        price: "45",
        currency: "SAR",
      },
    ]);
  });

  it("cuts the text at the limit", () => {
    const reading = parsePage(HTML, BASE, 5);
    expect(reading.text).toBe("Black");
    expect(reading.truncated).toBe(true);
  });

  it("reads a page with no title, language or products", () => {
    expect(parsePage("<p>Hello</p>", BASE)).toEqual({
      text: "Hello",
      truncated: false,
      products: [],
    });
  });
});
