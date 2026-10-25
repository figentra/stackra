/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `PdfEngine` port: an abstract class that extends `Port`, keyed
 *          `documents.PdfEngine`, that makes a driver implement `print`, and that is handed the HTML and the page.
 * Boundary: test only; the driver is a local recording engine.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0365 (decision 2).
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { PdfEngine } from "#contracts/ports/pdf-engine.port";
import type { PdfPage } from "#contracts/types/pdf-page.type";

class RecordingPdfEngine extends Driver(PdfEngine) {
  readonly calls: { html: string; page: PdfPage }[] = [];

  print(html: string, page: PdfPage): Promise<Uint8Array> {
    this.calls.push({ html, page });
    return Promise.resolve(new TextEncoder().encode("%PDF-1.7"));
  }
}

describe("PdfEngine", () => {
  it("is an abstract port keyed documents.PdfEngine", () => {
    expect(new RecordingPdfEngine()).toBeInstanceOf(Port);
    expect(new RecordingPdfEngine()).toBeInstanceOf(PdfEngine);
    expectTypeOf<PdfEngine["~key"]>().toEqualTypeOf<"documents.PdfEngine">();
    expectTypeOf<PdfEngine["print"]>().returns.toEqualTypeOf<Promise<Uint8Array>>();
  });

  it("makes a driver implement print", () => {
    // @ts-expect-error -- print is abstract and not implemented
    class EmptyDriver extends Driver(PdfEngine) {}
    expect(EmptyDriver).toBeTypeOf("function");
  });

  it("is handed the HTML and the page", async () => {
    const engine = new RecordingPdfEngine();
    const page = { widthMm: 80, marginMm: 2 };
    await engine.print("<p>x</p>", page);
    expect(engine.calls).toEqual([{ html: "<p>x</p>", page }]);
  });
});
