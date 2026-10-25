/**
 * Stackra file contract:
 * Purpose: unit tests of `batchZpl`: labels joined in order with a line break between, one label unchanged in content,
 *          and the refusals (no labels, a PDF label).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0369 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { LabelFormat } from "#contracts/enums/label-format.enum";
import type { LabelDocument } from "#contracts/types/label-document.type";
import { batchZpl } from "#core/functions/batch-zpl.function";

const zpl = (text: string): LabelDocument => ({
  format: LabelFormat.Zpl,
  bytes: new TextEncoder().encode(text),
});
const text = (label: LabelDocument) => new TextDecoder().decode(label.bytes);

describe("batchZpl", () => {
  it("joins labels in order with a line break between", () => {
    const batch = batchZpl([zpl("^XA^FD1^XZ"), zpl("^XA^FD2^XZ")]);
    expect(batch.format).toBe(LabelFormat.Zpl);
    expect(text(batch)).toBe("^XA^FD1^XZ\n^XA^FD2^XZ");
  });

  it("copies a single label", () => {
    const one = zpl("^XA^XZ");
    expect(text(batchZpl([one]))).toBe("^XA^XZ");
  });

  it("refuses an empty list", () => {
    expect(() => batchZpl([])).toThrow(RangeError);
  });

  it("refuses a PDF label", () => {
    const pdf: LabelDocument = {
      format: LabelFormat.Pdf,
      bytes: new TextEncoder().encode("%PDF-"),
    };
    expect(() => batchZpl([zpl("^XA^XZ"), pdf])).toThrow(RangeError);
  });
});
