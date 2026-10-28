/**
 * Stackra file contract:
 * Purpose: unit tests of `labelDocument`: PDF and ZPL accepted from bytes and from base64 (with whitespace), and each
 *          refusal reason (`not_base64`, `empty`, `signature`, a ZPL format left open).
 * Boundary: test only; the documents are minimal envelopes, not real labels.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0369 (decision 5).
 */
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { LabelFormat } from "#contracts/enums/label-format.enum";
import { LabelDocumentInvalidError } from "#core/errors/label-document-invalid.error";
import { labelDocument } from "#core/functions/label-document.function";

const bytes = (text: string) => new TextEncoder().encode(text);
const PDF = "%PDF-1.7\n%%EOF\n";
const ZPL = "~SD15\n^XA^FO50,50^FDHello^FS^XZ\n";

/** The refusal reason `run` throws with. */
function reasonOf(run: () => unknown): unknown {
  try {
    run();
  } catch (error) {
    return isRefusal(error, LabelDocumentInvalidError) ? error.details.reason : error;
  }
  return undefined;
}

describe("labelDocument", () => {
  it("accepts PDF and ZPL bytes and keeps them", () => {
    const pdf = bytes(PDF);
    expect(labelDocument(LabelFormat.Pdf, pdf)).toEqual({ format: "pdf", bytes: pdf });
    expect(labelDocument(LabelFormat.Zpl, bytes(ZPL)).format).toBe("zpl");
  });

  it("decodes base64 and ignores its line breaks", () => {
    const encoded = btoa(PDF).replaceAll(/(.{8})/g, "$1\n");
    expect(labelDocument(LabelFormat.Pdf, encoded).bytes).toEqual(bytes(PDF));
  });

  it("refuses text that is not base64", () => {
    expect(reasonOf(() => labelDocument(LabelFormat.Pdf, "%%%"))).toBe("not_base64");
  });

  it("refuses an empty document", () => {
    expect(reasonOf(() => labelDocument(LabelFormat.Zpl, new Uint8Array()))).toBe("empty");
  });

  it("refuses a document that is not the format it claims", () => {
    expect(reasonOf(() => labelDocument(LabelFormat.Pdf, bytes(ZPL)))).toBe("signature");
    expect(reasonOf(() => labelDocument(LabelFormat.Zpl, bytes(PDF)))).toBe("signature");
    expect(reasonOf(() => labelDocument(LabelFormat.Zpl, bytes("^XA^FDcut off")))).toBe(
      "signature",
    );
  });
});
