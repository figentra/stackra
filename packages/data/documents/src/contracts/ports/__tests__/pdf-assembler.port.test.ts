/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `PdfAssembler` port: an abstract class that extends `Port`, keyed
 *          `documents.PdfAssembler`, that makes a driver implement `merge` and `hybrid`.
 * Boundary: test only; the driver is a local recording assembler.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0365 (decision 2).
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { PdfAssembler } from "#contracts/ports/pdf-assembler.port";
import type { HybridPdfInput } from "#contracts/types/hybrid-pdf-input.type";

class RecordingPdfAssembler extends Driver(PdfAssembler) {
  readonly merged: (readonly Uint8Array[])[] = [];

  readonly hybrids: HybridPdfInput[] = [];

  merge(pdfs: readonly Uint8Array[]): Promise<Uint8Array> {
    this.merged.push(pdfs);
    return Promise.resolve(new Uint8Array([pdfs.length]));
  }

  hybrid(input: HybridPdfInput): Promise<Uint8Array> {
    this.hybrids.push(input);
    return Promise.resolve(input.pdf);
  }
}

describe("PdfAssembler", () => {
  it("is an abstract port keyed documents.PdfAssembler", () => {
    expect(new RecordingPdfAssembler()).toBeInstanceOf(Port);
    expect(new RecordingPdfAssembler()).toBeInstanceOf(PdfAssembler);
    expectTypeOf<PdfAssembler["~key"]>().toEqualTypeOf<"documents.PdfAssembler">();
    expectTypeOf<PdfAssembler["merge"]>().returns.toEqualTypeOf<Promise<Uint8Array>>();
  });

  it("makes a driver implement merge and hybrid", () => {
    // @ts-expect-error -- merge and hybrid are abstract and not implemented
    class EmptyDriver extends Driver(PdfAssembler) {}
    expect(EmptyDriver).toBeTypeOf("function");
  });

  it("is handed the PDFs in order", async () => {
    const assembler = new RecordingPdfAssembler();
    const pdfs = [new Uint8Array([1]), new Uint8Array([2])];
    expect(await assembler.merge(pdfs)).toEqual(new Uint8Array([2]));
    expect(assembler.merged).toEqual([pdfs]);
  });
});
