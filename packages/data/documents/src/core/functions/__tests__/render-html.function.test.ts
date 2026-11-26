/**
 * Stackra file contract:
 * Purpose: unit tests of `renderHtml`: one self-contained page with the template's page size, `dir` and `lang` per
 *          locale, values in `<bdi>`, escaped data, the side-by-side and stacked layouts, an inline SVG QR and a\n *          `data:` image.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0365.
 */
import { describe, expect, it } from "@stackra/testing";

import { parseDocumentTemplate } from "#core/functions/parse-document-template.function";
import { renderHtml } from "#core/functions/render-html.function";
import { resolveDocument } from "#core/functions/resolve-document.function";

import type { DocumentTemplate } from "#core/types/document-template.type";

/** Renderers only inline the bytes, so the PNG signature alone stands for an image. */
const SIGNATURE_IMAGE = {
  mediaType: "image/png" as const,
  bytes: new Uint8Array([0x89, 0x50, 0x4e, 0x47]),
};

const CURRENCY = {
  exponent: 2,
  ar: {
    major: {
      singular: "ريال",
      dual: "ريالان",
      plural: "ريالات",
      accusative: "ريالًا",
      feminine: false,
    },
    minor: { singular: "هللة", dual: "هللتان", plural: "هللات", accusative: "هللةً", feminine: true },
  },
  en: {
    major: { singular: "riyal", plural: "riyals" },
    minor: { singular: "halala", plural: "halalas" },
  },
};

const TEMPLATE = {
  kind: "print",
  name: "receipt",
  version: "3",
  page: { widthMm: 148, heightMm: 210, marginMm: 10 },
  locales: [
    { code: "ar", direction: "rtl", font: "Noto Naskh Arabic" },
    { code: "en", direction: "ltr" },
  ],
  layout: "side-by-side",
  blocks: [
    {
      type: "text",
      role: "title",
      text: { ar: "إيصال {{order.number}}", en: "Receipt {{order.number}}" },
    },
    {
      type: "table",
      rows: "order.lines",
      columns: [
        { header: { ar: "الصنف", en: "Item" }, value: "name" },
        { header: { ar: "الكمية", en: "Qty" }, value: "quantity", align: "end" },
      ],
    },
    { type: "qr", value: "{{order.verifyUrl}}", sizeMm: 25, align: "center" },
    {
      type: "amount-in-words",
      amount: "order.totalMinor",
      currency: "currency",
      prefix: { ar: "فقط", en: "Only" },
    },
    {
      type: "signature",
      image: "signer.image",
      label: { ar: "التوقيع", en: "Signature" },
      widthMm: 40,
      heightMm: 15,
    },
  ],
} satisfies DocumentTemplate;

const DATA = {
  order: {
    number: "R-1001",
    verifyUrl: "https://verify.example/R-1001",
    totalMinor: 123_550n,
    lines: [{ name: "<b>Tea</b>", quantity: 2 }],
  },
  currency: CURRENCY,
  signer: { image: SIGNATURE_IMAGE },
};

/** The page after its `<body>` tag: what the blocks and the brand rendered. */
const bodyOf = (html: string): string => html.slice(html.indexOf("<body>") + "<body>".length);

describe("renderHtml", () => {
  it("adds a brand's logo and accent and leaves every block as it was", () => {
    const plain = renderHtml(resolveDocument(parseDocumentTemplate(TEMPLATE), DATA));
    const branded = renderHtml(
      resolveDocument(
        parseDocumentTemplate({
          ...TEMPLATE,
          brand: { logo: "brand.logo", accent: "brand.accent" },
        }),
        { ...DATA, brand: { logo: SIGNATURE_IMAGE, accent: "#1F6B4A" } },
      ),
    );

    const logo =
      '<figure class="brand-logo start"><img src="data:image/png;base64,iVBORw==" alt=""></figure>';
    expect(bodyOf(branded)).toBe(`${logo}${bodyOf(plain)}`);
    expect(branded).toContain("h1{color:#1F6B4A}th{border-bottom-color:#1F6B4A}");
    expect(bodyOf(plain)).not.toContain("brand-logo");
  });

  it("ignores a brand value it cannot use, and never refuses for it", () => {
    const html = renderHtml(
      resolveDocument(
        parseDocumentTemplate({
          ...TEMPLATE,
          brand: { logo: "brand.logo", accent: "brand.accent" },
        }),
        {
          ...DATA,
          brand: {
            logo: { mediaType: "image/svg+xml", bytes: new Uint8Array(4) },
            accent: "red;}body{",
          },
        },
      ),
    );

    expect(bodyOf(html)).not.toContain("brand-logo");
    expect(html).not.toContain("red;}");
    expect(html).not.toContain("h1{color:");
  });

  it("writes a self-contained right-to-left page", () => {
    const html = renderHtml(resolveDocument(parseDocumentTemplate(TEMPLATE), DATA));
    expect(html.startsWith('<!doctype html><html lang="ar" dir="rtl">')).toBe(true);
    expect(html).toContain("@page{size:148mm 210mm;margin:10mm}");
    expect(html).toContain('[lang="ar"]{font-family:"Noto Naskh Arabic",sans-serif}');
    expect(html).toContain(
      '<div class="pair"><h1 class="start" dir="rtl" lang="ar">إيصال <bdi>R-1001</bdi></h1>',
    );
    expect(html).toContain(
      '<h1 class="start" dir="ltr" lang="en">Receipt <bdi>R-1001</bdi></h1></div>',
    );
    expect(html).toContain("&lt;b&gt;Tea&lt;/b&gt;");
    expect(html).not.toContain("<b>Tea</b>");
    expect(html).toContain('<figure class="center"><svg');
    expect(html).toContain('src="data:image/png;base64,iVBORw=="');
    expect(html).not.toMatch(/<script|<link|https?:\/\/(?!www\.w3\.org|verify\.example)/u);
  });

  it("stacks the locales and sizes a roll by its content", () => {
    const html = renderHtml(
      resolveDocument(
        parseDocumentTemplate({
          ...TEMPLATE,
          page: { widthMm: 80, marginMm: 2 },
          layout: "stacked",
          blocks: [TEMPLATE.blocks[0]],
        }),
        DATA,
      ),
    );
    expect(html).toContain("@page{size:80mm auto;margin:2mm}");
    expect(html).not.toContain('class="pair"');
    expect(html).toContain("</h1><h1 class");
  });
});
