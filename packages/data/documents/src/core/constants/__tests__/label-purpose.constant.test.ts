/**
 * Stackra file contract:
 * Purpose: unit tests of `LABEL_PURPOSE` and of the three label kinds as templates: a shelf label (price, unit price,
 *          EAN-13), a food label (ingredients, dates, weighed-goods barcode) and a short-dated label (struck old
 *          price) resolve and render to HTML and DOCX; a bad barcode or an oversized QR value is refused by path.
 * Boundary: test only. The templates are fixtures standing in for studio data, not shipped templates.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0365 (decision 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { LABEL_PURPOSE } from "#core/constants/label-purpose.constant";
import { DocumentValueError } from "#core/errors/document-value.error";
import { parseDocumentTemplate } from "#core/functions/parse-document-template.function";
import { renderDocx } from "#core/functions/render-docx.function";
import { renderHtml } from "#core/functions/render-html.function";
import { resolveDocument } from "#core/functions/resolve-document.function";

import type { DocumentTemplate } from "#core/types/document-template.type";

const PAGE = { widthMm: 58, heightMm: 40, marginMm: 2 };
const LOCALES = [
  { code: "ar", direction: "rtl" as const },
  { code: "en", direction: "ltr" as const },
];

const SHELF = {
  kind: "print",
  name: "shelf",
  purpose: LABEL_PURPOSE.Shelf,
  version: "1",
  page: PAGE,
  locales: LOCALES,
  layout: "stacked",
  blocks: [
    { type: "text", role: "heading", text: { ar: "{{item.nameAr}}", en: "{{item.name}}" } },
    { type: "text", text: { ar: "{{item.price}}", en: "{{item.price}}" } },
    {
      type: "text",
      role: "note",
      text: { ar: "{{item.unitPrice}} / كغ", en: "{{item.unitPrice}} / kg" },
    },
    { type: "barcode", symbology: "ean-13", value: "{{item.gtin}}", widthMm: 30, heightMm: 10 },
  ],
} satisfies DocumentTemplate;

const FOOD = {
  ...SHELF,
  name: "food",
  purpose: LABEL_PURPOSE.Food,
  blocks: [
    { type: "text", role: "heading", text: { ar: "{{item.nameAr}}", en: "{{item.name}}" } },
    {
      type: "text",
      text: { ar: "المكونات: {{item.ingredientsAr}}", en: "Ingredients: {{item.ingredients}}" },
    },
    { type: "text", text: { ar: "تاريخ الانتهاء {{item.useBy}}", en: "Use by {{item.useBy}}" } },
    {
      type: "barcode",
      symbology: "ean-13",
      value: "{{item.weighedCode}}",
      widthMm: 30,
      heightMm: 10,
    },
  ],
} satisfies DocumentTemplate;

const SHORT_DATED = {
  ...SHELF,
  name: "short-dated",
  purpose: LABEL_PURPOSE.ShortDated,
  blocks: [
    { type: "text", role: "struck", text: { ar: "{{item.price}}", en: "{{item.price}}" } },
    {
      type: "text",
      role: "title",
      text: { ar: "{{item.reducedPrice}}", en: "{{item.reducedPrice}}" },
    },
    {
      type: "barcode",
      symbology: "ean-13",
      value: "{{item.gtin}}",
      widthMm: 30,
      heightMm: 8,
      showText: false,
    },
  ],
} satisfies DocumentTemplate;

const DATA = {
  item: {
    name: "Dates",
    nameAr: "تمر",
    price: "12.50",
    reducedPrice: "8.00",
    unitPrice: "25.00",
    ingredients: "dates",
    ingredientsAr: "تمر",
    useBy: new Date(Date.UTC(2026, 10, 3)),
    gtin: "400638133393",
    weighedCode: "2112345012506",
  },
};

describe("LABEL_PURPOSE", () => {
  it("names the three label kinds", () => {
    expect(LABEL_PURPOSE).toEqual({
      Shelf: "label.shelf",
      Food: "label.food",
      ShortDated: "label.short-dated",
    });
  });

  it("renders a shelf label with its barcode digits", async () => {
    const resolved = resolveDocument(parseDocumentTemplate(SHELF), DATA);
    expect(resolved.template.purpose).toBe("label.shelf");
    const barcode = resolved.blocks[3];
    expect(barcode?.type === "barcode" && barcode.text).toBe("4006381333931");
    const html = renderHtml(resolved);
    expect(html).toContain('preserveAspectRatio="none"');
    expect(html).toContain('<p dir="ltr">4006381333931</p>');
    const docx = await renderDocx(resolved);
    expect(new TextDecoder().decode(docx.subarray(0, 2))).toBe("PK");
  });

  it("renders a food label with a weighed-goods code", () => {
    const resolved = resolveDocument(parseDocumentTemplate(FOOD), DATA);
    const barcode = resolved.blocks[3];
    expect(barcode?.type === "barcode" && barcode.text).toBe("2112345012506");
    expect(renderHtml(resolved)).toContain('lang="ar"');
  });

  it("renders a short-dated label with the old price struck and no digits", async () => {
    const resolved = resolveDocument(parseDocumentTemplate(SHORT_DATED), DATA);
    const html = renderHtml(resolved);
    expect(html).toContain('<s class="start" dir="rtl" lang="ar"><bdi>12.50</bdi></s>');
    expect(html).not.toContain("4006381333931");
    const docx = await renderDocx(resolved);
    expect(docx.length).toBeGreaterThan(1000);
  });

  it("refuses a barcode value that is not a valid EAN-13 by the block's path", () => {
    const template = parseDocumentTemplate(SHELF);
    const data = { item: { ...DATA.item, gtin: "4006381333932" } };
    expect(() => resolveDocument(template, data)).toThrow(DocumentValueError);
    try {
      resolveDocument(template, data);
    } catch (error) {
      expect(error).toMatchObject({ path: "blocks.3.value", reason: "invalid" });
    }
  });

  it("refuses a QR value larger than a QR code holds", () => {
    const template = parseDocumentTemplate({
      ...SHELF,
      blocks: [{ type: "qr", value: "{{blob}}", sizeMm: 20 }],
    });
    expect(() => resolveDocument(template, { blob: "x".repeat(8000) })).toThrow(DocumentValueError);
  });
});
