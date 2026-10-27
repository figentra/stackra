/**
 * Stackra file contract:
 * Purpose: unit and type tests of `HybridPdfBinding`: it carries fiscal's `HybridPdf` brand and key and hands
 *          `attach` to the bound `PdfAssembler.hybrid` unchanged.
 * Boundary: test only; the assembler is a local recording driver. Fiscal is not imported (no dependency), so the
 *           port's shape is checked by its brand, key and method.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0364 (decision 6).
 */
import { Driver } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { PdfAssembler } from "#contracts/ports/pdf-assembler.port";
import type { HybridPdfInput } from "#contracts/types/hybrid-pdf-input.type";
import { HybridPdfBinding } from "#core/bindings/hybrid-pdf.binding";

class RecordingAssembler extends Driver(PdfAssembler) {
  readonly inputs: HybridPdfInput[] = [];

  merge(): Promise<Uint8Array> {
    return Promise.resolve(new Uint8Array());
  }

  hybrid(input: HybridPdfInput): Promise<Uint8Array> {
    this.inputs.push(input);
    return Promise.resolve(new Uint8Array([7]));
  }
}

const REQUEST: HybridPdfInput = {
  pdf: new Uint8Array([1]),
  xml: "<x/>",
  fileName: "factur-x.xml",
  conformanceLevel: "EN 16931",
  version: "1.0",
  documentType: "INVOICE",
};

describe("HybridPdfBinding", () => {
  it("has the shape of fiscal's HybridPdf", () => {
    expectTypeOf<HybridPdfBinding["~kind"]>().toEqualTypeOf<"port">();
    expectTypeOf<HybridPdfBinding["~key"]>().toEqualTypeOf<"fiscal.HybridPdf">();
    expectTypeOf<HybridPdfBinding["attach"]>().parameter(0).toEqualTypeOf<HybridPdfInput>();
    expectTypeOf<HybridPdfBinding["attach"]>().returns.toEqualTypeOf<Promise<Uint8Array>>();
  });

  it("hands the request to the assembler", async () => {
    const assembler = new RecordingAssembler();
    expect(await new HybridPdfBinding(assembler).attach(REQUEST)).toEqual(new Uint8Array([7]));
    expect(assembler.inputs).toEqual([REQUEST]);
  });
});
