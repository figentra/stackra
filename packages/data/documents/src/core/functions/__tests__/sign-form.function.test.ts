/**
 * Stackra file contract:
 * Purpose: unit tests of `signForm`: the signer placed under `signer`, the PDF and signature hashes, and the refusals of
 *          data that sets `signer` and of a template with no signature block bound to `signer.image`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0365.
 */
import { Driver } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { PdfEngine } from "#contracts/ports/pdf-engine.port";
import { DocumentValueError } from "#core/errors/document-value.error";
import { InvalidDocumentTemplateError } from "#core/errors/invalid-document-template.error";
import { contentHashOf } from "#core/functions/content-hash-of.function";
import { signForm } from "#core/functions/sign-form.function";

import type { DocumentTemplate } from "#core/types/document-template.type";

/** Renderers only inline the bytes, so the PNG signature alone stands for an image. */
const SIGNATURE_IMAGE = {
  mediaType: "image/png" as const,
  bytes: new Uint8Array([0x89, 0x50, 0x4e, 0x47]),
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

class HtmlAsPdfEngine extends Driver(PdfEngine) {
  print(html: string): Promise<Uint8Array> {
    return Promise.resolve(new TextEncoder().encode(html));
  }
}

const FORM = {
  ...TEMPLATE,
  blocks: [
    { type: "text", text: { ar: "الاسم {{signer.name}}", en: "Name {{signer.name}}" } },
    {
      type: "signature",
      image: "signer.image",
      label: { ar: "التوقيع", en: "Signature" },
      widthMm: 40,
      heightMm: 15,
    },
  ],
} satisfies DocumentTemplate;
const SIGNER = {
  name: "Sara",
  signedAt: new Date(Date.UTC(2026, 9, 25, 9)),
  image: SIGNATURE_IMAGE,
};

describe("signForm", () => {
  it("places the signature and hashes the PDF and the signature", async () => {
    const form = await signForm({
      template: FORM,
      data: {},
      signer: SIGNER,
      pdfEngine: new HtmlAsPdfEngine(),
    });
    const html = new TextDecoder().decode(form.pdf.bytes);
    expect(html).toContain("<bdi>Sara</bdi>");
    expect(html).toContain("data:image/png;base64,");
    expect(form.pdf.contentHash).toBe(await contentHashOf(form.pdf.bytes));
    expect(form.signatureHash).toBe(await contentHashOf(SIGNATURE_IMAGE.bytes));
    expect(form).toMatchObject({ signerName: "Sara", signedAt: "2026-10-25T09:00:00.000Z" });
  });

  it("refuses data that sets signer and a template with no signature block", async () => {
    const pdfEngine = new HtmlAsPdfEngine();
    await expect(
      signForm({ template: FORM, data: { signer: {} }, signer: SIGNER, pdfEngine }),
    ).rejects.toThrow(DocumentValueError);
    await expect(
      signForm({
        template: { ...FORM, blocks: FORM.blocks.slice(0, 1) },
        data: {},
        signer: SIGNER,
        pdfEngine,
      }),
    ).rejects.toThrow(InvalidDocumentTemplateError);
  });
});
