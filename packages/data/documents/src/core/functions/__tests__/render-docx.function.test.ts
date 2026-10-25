/**
 * Stackra file contract:
 * Purpose: unit tests of `renderDocx`: a Word file (a zip) for a page template, and the refusal of a roll template.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0365.
 */
import { describe, expect, it } from "@stackra/testing";

import { InvalidDocumentTemplateError } from "#core/errors/invalid-document-template.error";
import { parseDocumentTemplate } from "#core/functions/parse-document-template.function";
import { renderDocx } from "#core/functions/render-docx.function";
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

describe("renderDocx", () => {
  it("writes a DOCX zip", async () => {
    const docx = await renderDocx(resolveDocument(parseDocumentTemplate(TEMPLATE), DATA));
    expect(new TextDecoder().decode(docx.subarray(0, 2))).toBe("PK");
    expect(docx.length).toBeGreaterThan(1000);
  });

  it("refuses a roll template", async () => {
    const roll = parseDocumentTemplate({ ...TEMPLATE, page: { widthMm: 80, marginMm: 2 } });
    await expect(renderDocx(resolveDocument(roll, DATA))).rejects.toThrow(
      InvalidDocumentTemplateError,
    );
  });
});
