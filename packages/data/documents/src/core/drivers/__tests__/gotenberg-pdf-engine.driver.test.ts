/**
 * Stackra file contract:
 * Purpose: unit tests of the `gotenberg` `PdfEngine` driver: it posts the HTML untouched as `index.html` to the
 *          Chromium route with the page in centimetres, prints a roll as a single page, sends the endpoint's headers,
 *          answers the PDF bytes, and turns an error status or an unreachable engine into `PdfEngineFailedError`.
 * Boundary: test only; `fetch` is stubbed, no engine. Arabic shaping is Chromium's and is not checked here.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0365 (decision 2).
 */
import { buildConfig, MemorySecretStoreDriver } from "@stackra/config";
import { kindOf } from "@stackra/container";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { DocumentsConfig } from "#config/documents.config";
import { PdfEngine } from "#contracts/ports/pdf-engine.port";
import { GotenbergPdfEngineDriver } from "#core/drivers/gotenberg-pdf-engine.driver";
import { PdfEngineFailedError } from "#core/errors/pdf-engine-failed.error";

const ENDPOINT = buildConfig(DocumentsConfig, {
  values: { gotenbergUrl: "http://gotenberg:3000/", gotenbergTimeoutMs: 5000 },
  secrets: new MemorySecretStoreDriver().set("DOCUMENTS_GOTENBERG_AUTHORIZATION", "Basic x"),
});

const HTML =
  '<!doctype html><html lang="ar" dir="rtl"><body><p>مرحبا <bdi>R-1</bdi></p></body></html>';

/** Stubs `fetch` with one answer and returns the spy. */
function answer(response: () => Promise<Response>) {
  const fetch = vi.fn(response);
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

/** The URL, init and form of the first request. */
function request(fetch: ReturnType<typeof answer>) {
  const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
  return { url, init, form: init.body as FormData };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GotenbergPdfEngineDriver", () => {
  it("is a driver of PdfEngine", () => {
    expect(new GotenbergPdfEngineDriver(ENDPOINT)).toBeInstanceOf(PdfEngine);
    expect(kindOf(GotenbergPdfEngineDriver)?.kind).toBe("driver");
  });

  it("posts the HTML untouched with the page in centimetres", async () => {
    const fetch = answer(() => Promise.resolve(new Response(new Uint8Array([0x25, 0x50]))));
    const pdf = await new GotenbergPdfEngineDriver(ENDPOINT).print(HTML, {
      widthMm: 210,
      heightMm: 297,
      marginMm: 10,
    });
    expect(pdf).toEqual(new Uint8Array([0x25, 0x50]));
    const { url, init, form } = request(fetch);
    expect(url).toBe("http://gotenberg:3000/forms/chromium/convert/html");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ authorization: "Basic x" });
    const file = form.get("files") as File;
    expect(file.name).toBe("index.html");
    expect(await file.text()).toBe(HTML);
    expect(form.get("paperWidth")).toBe("21cm");
    expect(form.get("paperHeight")).toBe("29.7cm");
    expect(form.get("marginRight")).toBe("1cm");
    expect(form.get("singlePage")).toBeNull();
  });

  it("prints a roll as one page", async () => {
    const fetch = answer(() => Promise.resolve(new Response(new Uint8Array([1]))));
    await new GotenbergPdfEngineDriver(ENDPOINT).print(HTML, { widthMm: 80, marginMm: 2 });
    const { form } = request(fetch);
    expect(form.get("singlePage")).toBe("true");
    expect(form.get("paperHeight")).toBeNull();
    expect(form.get("marginTop")).toBe("0.2cm");
  });

  it("refuses an error status and an unreachable engine", async () => {
    answer(() => Promise.resolve(new Response("bad", { status: 500 })));
    await expect(
      new GotenbergPdfEngineDriver(ENDPOINT).print(HTML, { widthMm: 80, marginMm: 2 }),
    ).rejects.toMatchObject({ route: "/forms/chromium/convert/html", status: 500 });
    answer(() => Promise.reject(new TypeError("fetch failed")));
    await expect(
      new GotenbergPdfEngineDriver(ENDPOINT).print(HTML, { widthMm: 80, marginMm: 2 }),
    ).rejects.toBeInstanceOf(PdfEngineFailedError);
  });
});
