/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: the constants, the memory, connection and gotenberg drivers, the Documenso Integration and Connection, the hybrid PDF
 *          binding, the format enum, the eight refusals and the public functions are exported and nothing else is (no internal helper, no port); the
 *          public types resolve.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as documents from "#core/index";
import type {
  CurrencyWords,
  DocumentTemplate,
  ESignatureConnection,
  GotenbergEndpoint,
  ImageAsset,
  ParsedDocumentTemplate,
  QrMatrix,
  RenderedDocument,
  ResolvedBlock,
  ResolvedDocument,
  SignedForm,
  SignerInput,
  TextPart,
} from "#core/index";

describe("@stackra/documents", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(documents).sort()).toEqual([
      "AmountWordsUnavailableError",
      "CURRENCY_WORDS_SCHEMA",
      "ConnectionESignatureDriver",
      "DOCUMENT_TEMPLATE_SCHEMA",
      "DocumensoConnection",
      "DocumensoIntegration",
      "DocumentFormat",
      "DocumentValueError",
      "GotenbergPdfAssemblerDriver",
      "GotenbergPdfEngineDriver",
      "HybridPdfBinding",
      "InvalidDocumentTemplateError",
      "LABEL_PURPOSE",
      "MemoryESignatureDriver",
      "PRINT_DOCUMENT_KIND",
      "PdfEngineFailedError",
      "SignatureEnvelopeClosedError",
      "SignatureEnvelopeNotFoundError",
      "SignatureNotCompleteError",
      "SignatureSignerUnreachableError",
      "contentHashOf",
      "encodeEan13",
      "encodeQr",
      "parseDocumentTemplate",
      "renderDocument",
      "renderDocx",
      "renderHtml",
      "resolveDocument",
      "shapeArabic",
      "signForm",
      "spellAmount",
      "toVisualOrder",
      "verifyContentHash",
    ]);
    expect("PdfEngine" in documents).toBe(false);
    expect("readPath" in documents).toBe(false);
    expect("postGotenbergForm" in documents).toBe(false);
  });

  it("resolves its public types", () => {
    expectTypeOf<DocumentTemplate["kind"]>().toEqualTypeOf<"print">();
    expectTypeOf<ParsedDocumentTemplate["layout"]>().toEqualTypeOf<
      "single" | "side-by-side" | "stacked"
    >();
    expectTypeOf<CurrencyWords["exponent"]>().toEqualTypeOf<number>();
    expectTypeOf<ESignatureConnection["send"]>().toEqualTypeOf<
      documents.DocumensoConnection["send"]
    >();
    expectTypeOf<GotenbergEndpoint["timeoutMs"]>().toEqualTypeOf<number>();
    expectTypeOf<ImageAsset["mediaType"]>().toEqualTypeOf<"image/png" | "image/jpeg">();
    expectTypeOf<QrMatrix>().toEqualTypeOf<readonly (readonly boolean[])[]>();
    expectTypeOf<RenderedDocument["format"]>().toEqualTypeOf<documents.DocumentFormat>();
    expectTypeOf<ResolvedBlock["type"]>().toEqualTypeOf<
      "text" | "table" | "qr" | "barcode" | "image" | "signature" | "amount-in-words"
    >();
    expectTypeOf<ResolvedDocument["blocks"]>().toEqualTypeOf<readonly ResolvedBlock[]>();
    expectTypeOf<SignedForm["signedAt"]>().toEqualTypeOf<string>();
    expectTypeOf<SignerInput["signedAt"]>().toEqualTypeOf<Date>();
    expectTypeOf<TextPart["isValue"]>().toEqualTypeOf<boolean>();
  });
});
