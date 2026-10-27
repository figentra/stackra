/**
 * Stackra file contract:
 * Purpose: unit tests of the `gotenberg` `PdfAssembler` driver: merge sends the PDFs under zero-padded names so the
 *          engine keeps their order, answers one PDF without a call and refuses none; hybrid posts the PDF, the XML
 *          and the Factur-X fields with PDF/A-3b to the factur-x route.
 * Boundary: test only; `fetch` is stubbed, no engine.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0365; ADR 0364.
 */
import { buildConfig } from "@stackra/config";
import { kindOf } from "@stackra/container";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { DocumentsConfig } from "#config/documents.config";
import { PdfAssembler } from "#contracts/ports/pdf-assembler.port";
import { GotenbergPdfAssemblerDriver } from "#core/drivers/gotenberg-pdf-assembler.driver";
import { DocumentValueError } from "#core/errors/document-value.error";

const ENDPOINT = buildConfig(DocumentsConfig, {
  values: { gotenbergUrl: "http://gotenberg:3000", gotenbergTimeoutMs: 5000 },
});

/** Stubs `fetch` to answer `bytes` and returns the spy. */
function answer(bytes = new Uint8Array([9])) {
  const fetch = vi.fn(() => Promise.resolve(new Response(bytes)));
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

/** The URL and form of the first request. */
function request(fetch: ReturnType<typeof answer>) {
  const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
  return { url, form: init.body as FormData };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GotenbergPdfAssemblerDriver", () => {
  it("is a driver of PdfAssembler", () => {
    expect(new GotenbergPdfAssemblerDriver(ENDPOINT)).toBeInstanceOf(PdfAssembler);
    expect(kindOf(GotenbergPdfAssemblerDriver)?.kind).toBe("driver");
  });

  it("merges in the caller's order under zero-padded names", async () => {
    const fetch = answer();
    const pdfs = Array.from({ length: 11 }, (_, index) => new Uint8Array([index]));
    expect(await new GotenbergPdfAssemblerDriver(ENDPOINT).merge(pdfs)).toEqual(
      new Uint8Array([9]),
    );
    const { url, form } = request(fetch);
    expect(url).toBe("http://gotenberg:3000/forms/pdfengines/merge");
    const files = form.getAll("files") as File[];
    expect(files.map((file) => file.name)).toEqual(
      pdfs.map((_, index) => `${String(index + 1).padStart(6, "0")}.pdf`),
    );
    const last = files.at(-1) ?? new Blob();
    expect(new Uint8Array(await last.arrayBuffer())).toEqual(new Uint8Array([10]));
  });

  it("answers one PDF without a call and refuses none", async () => {
    const fetch = answer();
    const only = new Uint8Array([1, 2]);
    expect(await new GotenbergPdfAssemblerDriver(ENDPOINT).merge([only])).toBe(only);
    expect(fetch).not.toHaveBeenCalled();
    await expect(new GotenbergPdfAssemblerDriver(ENDPOINT).merge([])).rejects.toBeInstanceOf(
      DocumentValueError,
    );
  });

  it("makes a hybrid invoice through the factur-x route", async () => {
    const fetch = answer();
    await new GotenbergPdfAssemblerDriver(ENDPOINT).hybrid({
      pdf: new Uint8Array([0x25]),
      xml: "<rsm:CrossIndustryInvoice/>",
      fileName: "factur-x.xml",
      conformanceLevel: "EN 16931",
      version: "1.0",
      documentType: "INVOICE",
    });
    const { url, form } = request(fetch);
    expect(url).toBe("http://gotenberg:3000/forms/pdfengines/factur-x");
    expect((form.get("files") as File).name).toBe("invoice.pdf");
    const xml = form.get("facturxXml") as File;
    expect(xml.name).toBe("factur-x.xml");
    expect(await xml.text()).toBe("<rsm:CrossIndustryInvoice/>");
    expect(form.get("facturxConformanceLevel")).toBe("EN 16931");
    expect(form.get("facturxDocumentType")).toBe("INVOICE");
    expect(form.get("facturxVersion")).toBe("1.0");
    expect(form.get("pdfa")).toBe("PDF/A-3b");
  });
});
