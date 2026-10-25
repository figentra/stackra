/**
 * Stackra file contract:
 * Purpose: unit tests of `resolveDocument`: placeholders per locale, table rows in the primary locale, the QR matrix,
 *          images, amounts in words with their affixes, and the refusals for missing or unusable values.
 * Boundary: test only.
 *           Currency names are fixtures, not market-pack values.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0365.
 */
import { describe, expect, it } from "@stackra/testing";

import { DocumentValueError } from "#core/errors/document-value.error";
import { InvalidDocumentTemplateError } from "#core/errors/invalid-document-template.error";
import { parseDocumentTemplate } from "#core/functions/parse-document-template.function";
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
    totalMinor: 123550n,
    lines: [{ name: "<b>Tea</b>", quantity: 2 }],
  },
  currency: CURRENCY,
  signer: { image: SIGNATURE_IMAGE },
};

describe("resolveDocument", () => {
  it("resolves every block kind", () => {
    const resolved = resolveDocument(parseDocumentTemplate(TEMPLATE), DATA);
    const [title, table, qr, words, signature] = resolved.blocks;
    expect(title).toEqual({
      type: "text",
      role: "title",
      align: "start",
      texts: [
        [
          { text: "إيصال ", isValue: false },
          { text: "R-1001", isValue: true },
        ],
        [
          { text: "Receipt ", isValue: false },
          { text: "R-1001", isValue: true },
        ],
      ],
    });
    expect(table).toEqual({
      type: "table",
      columns: [
        { headers: ["الصنف", "Item"], align: "start" },
        { headers: ["الكمية", "Qty"], align: "end" },
      ],
      rows: [["<b>Tea</b>", new Intl.NumberFormat("ar").format(2)]],
    });
    expect(qr?.type === "qr" && qr.matrix.length > 20).toBe(true);
    expect(words).toEqual({
      type: "amount-in-words",
      align: "start",
      texts: [
        "فقط ألف ومائتان وخمسة وثلاثون ريالًا وخمسون هللةً",
        "Only one thousand two hundred thirty-five riyals and fifty halalas",
      ],
    });
    expect(signature?.type === "signature" && signature.labels).toEqual(["التوقيع", "Signature"]);
  });

  it("refuses missing and unusable values", () => {
    const template = parseDocumentTemplate(TEMPLATE);
    expect(() =>
      resolveDocument(template, { ...DATA, order: { ...DATA.order, lines: "x" } }),
    ).toThrow(DocumentValueError);
    expect(() =>
      resolveDocument(template, { ...DATA, order: { ...DATA.order, totalMinor: -5 } }),
    ).toThrow(DocumentValueError);
    expect(() => resolveDocument(template, { ...DATA, currency: undefined })).toThrow(
      DocumentValueError,
    );
    expect(() =>
      resolveDocument(template, {
        ...DATA,
        signer: { image: { mediaType: "image/gif", bytes: new Uint8Array() } },
      }),
    ).toThrow(DocumentValueError);
    expect(() =>
      resolveDocument(template, { ...DATA, order: { ...DATA.order, lines: [{ name: "Tea" }] } }),
    ).toThrow(DocumentValueError);
  });

  it("refuses a block with no text for a locale", () => {
    const template = parseDocumentTemplate({
      ...TEMPLATE,
      blocks: [{ type: "text", text: { ar: "نص" } }],
    });
    expect(() => resolveDocument(template, DATA)).toThrow(InvalidDocumentTemplateError);
  });
});
